// app/api/test-talep/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

async function redis(command: unknown[]): Promise<unknown> {
  const res = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Redis error: ${data.error}`);
  return data.result;
}

async function redisSet(key: string, value: string, ttlSeconds?: number) {
  if (ttlSeconds) {
    await redis(['SET', key, value, 'EX', ttlSeconds]);
  } else {
    await redis(['SET', key, value]);
  }
}
async function redisGet(key: string): Promise<string | null> {
  return (await redis(['GET', key])) as string | null;
}
async function redisDel(key: string) {
  await redis(['DEL', key]);
}
async function redisIncr(key: string): Promise<number> {
  return (await redis(['INCR', key])) as number;
}
async function redisExpire(key: string, ttl: number) {
  await redis(['EXPIRE', key, ttl]);
}

type OtpRecord = {
  email:           string;
  otpHash:         string;
  ip:              string;
  selectedPackage: string;
};

type TrialRecord = {
  email:           string;
  ip:              string;
  createdAt:       number;
  selectedPackage: string;
  username:        string;
  password:        string;
};

function assertEnv() {
  const missing = [
    'EMAIL_USER','EMAIL_PASS','TRIAL_SERVICE_URL','TRIAL_API_SECRET',
    'UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN',
  ].filter((k) => !process.env[k]);
  if (missing.length > 0) throw new Error(`Eksik env: ${missing.join(', ')}`);
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}
function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','temp-mail.org','throwaway.email',
  'yopmail.com','sharklasers.com','guerrillamailblock.com','grr.la',
  'guerrillamail.info','guerrillamail.biz','guerrillamail.de','guerrillamail.net',
  'guerrillamail.org','spam4.me','trashmail.com','trashmail.me','trashmail.at',
  'trashmail.io','trashmail.net','dispostable.com','mailnull.com','spamgourmet.com',
  'maildrop.cc','discard.email','tempr.email','fakeinbox.com',
  'tempmail.com','tempmail.net','tempmail.org','10minutemail.com','10minutemail.net',
  'tempinbox.com','getairmail.com','filzmail.com','throwam.com','spamex.com',
  'mailexpire.com','mytemp.email','tempail.com','tempemail.net','spamtrap.ro',
  'armyspy.com','cuvox.de','dayrep.com','einrot.com','fleckens.hu',
  'gustr.com','jourrapide.com','rhyta.com','superrito.com','teleworm.us',
  'getnada.com','mohmal.com','meltmail.com','owlpic.com','spamgrap.com',
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX    = 2;
const RESEND_COOLDOWN   = 60;

async function checkRateLimit(ip: string): Promise<{ blocked: boolean; retryAfter?: number }> {
  if (ip === 'unknown') return { blocked: false };
  const key   = `rate:otp:${ip}`;
  const count = await redisIncr(key);
  if (count === 1) await redisExpire(key, RATE_LIMIT_WINDOW);
  if (count > RATE_LIMIT_MAX) {
    const ttl = (await redis(['TTL', key])) as number;
    return { blocked: true, retryAfter: ttl };
  }
  return { blocked: false };
}

async function checkResendCooldown(email: string): Promise<{ blocked: boolean; retryAfter?: number }> {
  const key = `resend:${email}`;
  const val = await redisGet(key);
  if (val) {
    const ttl = (await redis(['TTL', key])) as number;
    return { blocked: true, retryAfter: ttl };
  }
  await redisSet(key, '1', RESEND_COOLDOWN);
  return { blocked: false };
}

async function checkIpReputation(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
    return { blocked: false };
  }
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,proxy,hosting,mobile,query`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return { blocked: false };
    const data = await res.json();
    if (data.status !== 'success') return { blocked: false };
    if (data.proxy)   return { blocked: true, reason: 'VPN/Proxy bağlantısı tespit edildi. Lütfen VPN kapatarak tekrar deneyin.' };
    if (data.hosting) return { blocked: true, reason: 'Veri merkezi bağlantısı tespit edildi. Lütfen normal internet bağlantınızla tekrar deneyin.' };
    return { blocked: false };
  } catch {
    return { blocked: false };
  }
}

async function recordTrialIp(ip: string, email: string) {
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) return;
  await redis(['SET', `trial:ip:${ip}`, JSON.stringify({ email, createdAt: Date.now() })]);
}

const TRIAL_TTL = 7 * 24 * 60 * 60;

async function findExistingTrialByEmail(email: string): Promise<TrialRecord | null> {
  const byEmail = await redisGet(`trial:email:${email}`);
  if (byEmail) return JSON.parse(byEmail);
  return null;
}

async function findExistingTrialByIp(ip: string): Promise<{ email: string; createdAt: number } | null> {
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) return null;
  const val = await redisGet(`trial:ip:${ip}`);
  if (val) return JSON.parse(val);
  return null;
}

async function recordTrial(
  email: string, ip: string, selectedPackage: string, username: string, password: string,
) {
  const record: TrialRecord = { email, ip, createdAt: Date.now(), selectedPackage, username, password };
  await redisSet(`trial:email:${email}`, JSON.stringify(record), TRIAL_TTL);
  await recordTrialIp(ip, email);
}

const OTP_TTL = 10 * 60;
async function saveOtp(token: string, record: OtpRecord) {
  await redisSet(`otp:${token}`, JSON.stringify(record), OTP_TTL);
}
async function getOtp(token: string): Promise<OtpRecord | null> {
  const val = await redisGet(`otp:${token}`);
  return val ? JSON.parse(val) : null;
}
async function deleteOtp(token: string) {
  await redisDel(`otp:${token}`);
}

function createMailer() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

// ─── OTP Mail ────────────────────────────────────────────────────────────────
async function sendOtpMail(email: string, otp: string) {
  const transporter = createMailer();
  await transporter.sendMail({
    from: `GalyaStream <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'GalyaStream – Doğrulama Kodunuz',
    html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060d18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060d18;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

        <tr><td align="center" style="padding-bottom:28px">
          <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">Galya<span style="color:#3b82f6">Stream</span></span>
        </td></tr>

        <tr><td style="background:#0a1525;border:1px solid #1e2d42;border-radius:20px;overflow:hidden">
          <tr><td style="height:4px;background:linear-gradient(90deg,#3b82f6,#6366f1)"></td></tr>
          <tr><td style="padding:32px 32px 28px">

            <table cellpadding="0" cellspacing="0" style="margin-bottom:20px">
              <tr><td style="background:#1e3a5f;border-radius:14px;width:52px;height:52px;text-align:center;vertical-align:middle">
                <span style="font-size:24px;line-height:52px">🔑</span>
              </td></tr>
            </table>

            <h1 style="margin:0 0 8px;font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-0.3px">Doğrulama Kodunuz</h1>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#6b7280">
              Ücretsiz test hesabınızı açmak için aşağıdaki kodu girin. Kod <strong style="color:#8b9ab3">10 dakika</strong> geçerlidir.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#0d1a2d;border:1px solid #1e3a5f;border-radius:14px;padding:24px;margin-bottom:24px;text-align:center">
              <tr><td>
                <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px">Doğrulama Kodu</p>
                <p style="color:#ffffff;font-size:38px;font-weight:900;letter-spacing:10px;margin:0;font-family:monospace">${otp}</p>
              </td></tr>
            </table>

            <p style="margin:0;font-size:12px;color:#374151">Bu kodu kimseyle paylaşmayın. GalyaStream ekibi sizden hiçbir zaman kod istemez.</p>

          </td></tr>
          <tr><td style="background:#070f1c;border-top:1px solid #131f30;padding:14px 32px">
            <p style="margin:0;font-size:12px;color:#374151;line-height:1.5">⚠️ Bu kodu siz talep etmediyseniz görmezden gelebilirsiniz.</p>
          </td></tr>
        </td></tr>

        <tr><td align="center" style="padding-top:24px">
          <p style="margin:0 0 4px;font-size:12px;color:#1f2937">© 2025 GalyaStream — Donmayan IPTV</p>
          <p style="margin:0;font-size:11px;color:#111827">
            <a href="https://www.galyastream.com" style="color:#374151;text-decoration:none">galyastream.com</a>
            &nbsp;·&nbsp;
            <a href="https://wa.me/447441921660" style="color:#374151;text-decoration:none">Destek</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}

// ─── Test Bilgileri Mail ──────────────────────────────────────────────────────
async function sendTrialMail(email: string, username: string, password: string) {
  const SERVER = 'http://pro4kiptv.xyz:2086';
  const m3u = `${SERVER}/get.php?username=${username}&password=${password}&type=m3u&output=ts`;
  const whatsappUrl = `https://wa.me/447441921660?text=${encodeURIComponent('Merhaba, test hesabımı beğendim. Satın almak istiyorum.')}`;
  const transporter = createMailer();
  await transporter.sendMail({
    from: `GalyaStream <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'GalyaStream – Test Hesabınız Hazır! ✅',
    html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060d18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060d18;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

        <!-- Marka -->
        <tr><td align="center" style="padding-bottom:28px">
          <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">Galya<span style="color:#3b82f6">Stream</span></span>
        </td></tr>

        <!-- Ana kart -->
        <tr><td style="background:#0a1525;border:1px solid #1e2d42;border-radius:20px;overflow:hidden">
          <tr><td style="height:4px;background:linear-gradient(90deg,#3b82f6,#6366f1)"></td></tr>
          <tr><td style="padding:32px 32px 28px">

            <!-- İkon -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:20px">
              <tr><td style="background:#071a10;border-radius:14px;width:52px;height:52px;text-align:center;vertical-align:middle">
                <span style="font-size:24px;line-height:52px">✅</span>
              </td></tr>
            </table>

            <!-- Başlık -->
            <h1 style="margin:0 0 8px;font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-0.3px">Test Hesabınız Hazır!</h1>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#6b7280">
              Aşağıdaki bilgilerle <strong style="color:#8b9ab3">3 saat</strong> boyunca tüm içeriklere erişebilirsiniz.
            </p>

            <!-- Bilgiler kutusu -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#0d1a2d;border:1px solid #1e3a5f;border-radius:14px;margin-bottom:24px">
              <tr><td style="padding:18px 20px 14px">
                <p style="color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px">Sunucu URL</p>
                <p style="color:#3b82f6;font-size:14px;font-family:monospace;margin:0">${SERVER}</p>
              </td></tr>
              <tr><td style="padding:14px 20px;border-top:1px solid #1e2d42">
                <p style="color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px">Kullanıcı Adı</p>
                <p style="color:#ffffff;font-size:16px;font-weight:700;font-family:monospace;margin:0">${username}</p>
              </td></tr>
              <tr><td style="padding:14px 20px;border-top:1px solid #1e2d42">
                <p style="color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px">Şifre</p>
                <p style="color:#ffffff;font-size:16px;font-weight:700;font-family:monospace;margin:0">${password}</p>
              </td></tr>
              <tr><td style="padding:14px 20px 18px;border-top:1px solid #1e2d42">
                <p style="color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px">M3U Linki</p>
                <p style="color:#8b9ab3;font-size:11px;font-family:monospace;word-break:break-all;margin:0">${m3u}</p>
              </td></tr>
            </table>

            <!-- Butonlar -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <!-- Web sitesi butonu -->
              <tr><td style="padding-bottom:10px">
                <a href="https://www.galyastream.com/abonelik"
                  style="display:block;background:#3b82f6;color:#ffffff;font-weight:700;font-size:14px;padding:14px;border-radius:12px;text-decoration:none;text-align:center">
                  👑 Web Sitesi Üzerinden Satın Al
                </a>
              </td></tr>
              <!-- WhatsApp butonu -->
              <tr><td style="padding-bottom:10px">
                <a href="${whatsappUrl}"
                  style="display:block;background:#25d366;color:#ffffff;font-weight:700;font-size:14px;padding:14px;border-radius:100px;text-decoration:none;text-align:center">
                  💬 WhatsApp ile Satın Al
                </a>
              </td></tr>
              <!-- Kurulum rehberi butonu -->
              <tr><td>
                <a href="https://www.galyastream.com/kurulum-rehberi"
                  style="display:block;background:transparent;color:#8b9ab3;font-weight:600;font-size:13px;padding:12px;border-radius:12px;text-decoration:none;text-align:center;border:1px solid #1e2d42">
                  📺 Kurulum Rehberi →
                </a>
              </td></tr>
            </table>

          </td></tr>
          <tr><td style="background:#070f1c;border-top:1px solid #131f30;padding:14px 32px">
            <p style="margin:0;font-size:12px;color:#374151;line-height:1.5">
              ⚠️ Bu test hesabı 3 saat geçerlidir. Süre dolmadan abonelik satın alarak kesintisiz erişmeye devam edebilirsiniz.
            </p>
          </td></tr>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px">
          <p style="margin:0 0 4px;font-size:12px;color:#1f2937">© 2025 GalyaStream — Donmayan IPTV</p>
          <p style="margin:0;font-size:11px;color:#111827">
            <a href="https://www.galyastream.com" style="color:#374151;text-decoration:none">galyastream.com</a>
            &nbsp;·&nbsp;
            <a href="https://wa.me/447441921660" style="color:#374151;text-decoration:none">Destek</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
  });
}

async function createTrialUser() {
  const res = await fetch(`${process.env.TRIAL_SERVICE_URL}/create-trial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-secret': process.env.TRIAL_API_SECRET! },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Trial servisi HTTP ${res.status} döndürdü.`);
  const data = await res.json();
  if (!data.success || !data.username || !data.password)
    throw new Error(data.error || 'Trial servisi geçersiz yanıt döndürdü.');
  return { username: data.username as string, password: data.password as string };
}

export async function POST(req: NextRequest) {
  try {
    assertEnv();
    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json({ success: false, error: 'Geçersiz istek.' }, { status: 400 });

    const { action, email, otp, token, selectedPackage } = body as Record<string, string>;
    const ip = getIp(req);

    if (!email || !isValidEmail(email))
      return NextResponse.json({ success: false, error: 'Geçerli bir e-posta girin.' }, { status: 400 });

    // ── send_otp ──────────────────────────────────────────────────────────────
    if (action === 'send_otp') {
      if (isDisposableEmail(email))
        return NextResponse.json({ success: false, error: 'Geçici e-posta adresleri kabul edilmemektedir.' }, { status: 400 });

      const rateCheck = await checkRateLimit(ip);
      if (rateCheck.blocked)
        return NextResponse.json({ success: false, error: `Çok fazla istek. ${rateCheck.retryAfter} saniye bekleyin.`, retryAfter: rateCheck.retryAfter }, { status: 429 });

      const cooldownCheck = await checkResendCooldown(email);
      if (cooldownCheck.blocked)
        return NextResponse.json({ success: false, error: `Yeni kod için ${cooldownCheck.retryAfter} saniye bekleyin.`, retryAfter: cooldownCheck.retryAfter, cooldown: true }, { status: 429 });

      const ipCheck = await checkIpReputation(ip);
      if (ipCheck.blocked)
        return NextResponse.json({ success: false, error: ipCheck.reason }, { status: 403 });

      const existingByEmail = await findExistingTrialByEmail(email);
      if (existingByEmail) {
        const daysLeft = Math.ceil((TRIAL_TTL * 1000 - (Date.now() - existingByEmail.createdAt)) / 86400000);
        return NextResponse.json({ success: false, alreadyUsed: true, error: `Bu e-posta ile daha önce test oluşturulmuş. ${daysLeft} gün sonra tekrar deneyin.` }, { status: 429 });
      }
      const existingByIp = await findExistingTrialByIp(ip);
      if (existingByIp)
        return NextResponse.json({ success: false, alreadyUsed: true, error: 'Bu IP adresinden daha önce test alınmış. Yeni test için admin ile iletişime geçin.' }, { status: 429 });

      const generatedOtp   = generateOtp();
      const generatedToken = generateToken();
      await saveOtp(generatedToken, { email, otpHash: hashOtp(generatedOtp), ip, selectedPackage: selectedPackage || 'Belirtilmedi' });
      await sendOtpMail(email, generatedOtp);
      return NextResponse.json({ success: true, token: generatedToken });
    }

    // ── verify ────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      if (!otp || !token)
        return NextResponse.json({ success: false, error: 'Kod veya token eksik.' }, { status: 400 });

      const record = await getOtp(token);
      if (!record)
        return NextResponse.json({ success: false, error: 'Doğrulama kodu süresi dolmuş.' }, { status: 400 });
      if (record.email !== email)
        return NextResponse.json({ success: false, error: 'E-posta eşleşmedi.' }, { status: 400 });

      const inputHash = hashOtp(otp);
      if (!safeCompare(record.otpHash, inputHash))
        return NextResponse.json({ success: false, error: 'Doğrulama kodu hatalı.' }, { status: 400 });

      await deleteOtp(token);

      const existingByEmail = await findExistingTrialByEmail(email);
      if (existingByEmail)
        return NextResponse.json({ success: false, alreadyUsed: true, error: 'Bu e-posta ile daha önce test oluşturulmuş.' }, { status: 429 });

      const existingByIp = await findExistingTrialByIp(ip);
      if (existingByIp)
        return NextResponse.json({ success: false, alreadyUsed: true, error: 'Bu IP adresinden daha önce test alınmış.' }, { status: 429 });

      const creds = await createTrialUser();
      await recordTrial(email, ip, record.selectedPackage, creds.username, creds.password);
      await sendTrialMail(email, creds.username, creds.password);
      return NextResponse.json({ success: true, username: creds.username, password: creds.password });
    }

    // ── recover ───────────────────────────────────────────────────────────────
    if (action === 'recover') {
      if (!otp || !token)
        return NextResponse.json({ success: false, error: 'Kod veya token eksik.' }, { status: 400 });

      const record = await getOtp(token);
      if (!record)
        return NextResponse.json({ success: false, error: 'Doğrulama kodu süresi dolmuş.' }, { status: 400 });
      if (record.email !== email)
        return NextResponse.json({ success: false, error: 'E-posta eşleşmedi.' }, { status: 400 });

      const inputHash = hashOtp(otp);
      if (!safeCompare(record.otpHash, inputHash))
        return NextResponse.json({ success: false, error: 'Doğrulama kodu hatalı.' }, { status: 400 });

      await deleteOtp(token);

      const trial = await findExistingTrialByEmail(email);
      if (!trial?.username)
        return NextResponse.json({ success: false, error: 'Bu e-posta için aktif bir test kaydı bulunamadı.' }, { status: 404 });

      const twelveHours = 12 * 60 * 60 * 1000;
      if (Date.now() - trial.createdAt > twelveHours)
        return NextResponse.json({ success: false, error: 'Test hesabınızın süresi dolmuş.' }, { status: 410 });

      return NextResponse.json({ success: true, username: trial.username, password: trial.password });
    }

    // ── create_direct ─────────────────────────────────────────────────────────
    if (action === 'create_direct') {
      const byEmail = await findExistingTrialByEmail(email);
      if (byEmail) {
        return NextResponse.json({
          success: true,
          username: byEmail.username,
          password: byEmail.password,
          startedAt: byEmail.createdAt,
          alreadyExists: true,
        });
      }

      const byIp = await findExistingTrialByIp(ip);
      if (byIp) {
        return NextResponse.json({
          success: false,
          ipBlocked: true,
          error: 'Bu IP adresinden daha önce bir test hesabı oluşturulmuş. Yeni test için admin ile iletişime geçin.',
        }, { status: 429 });
      }

      const ipCheck = await checkIpReputation(ip);
      if (ipCheck.blocked)
        return NextResponse.json({ success: false, error: ipCheck.reason }, { status: 403 });

      const creds = await createTrialUser();
      await recordTrial(email, ip, selectedPackage || 'Belirtilmedi', creds.username, creds.password);
      await sendTrialMail(email, creds.username, creds.password);

      return NextResponse.json({
        success: true,
        username: creds.username,
        password: creds.password,
        startedAt: Date.now(),
        alreadyExists: false,
      });
    }

    // ── get_trial ─────────────────────────────────────────────────────────────
    if (action === 'get_trial') {
      const byEmail = await findExistingTrialByEmail(email);
      if (byEmail) {
        return NextResponse.json({
          success: true,
          username: byEmail.username,
          password: byEmail.password,
          startedAt: byEmail.createdAt,
        });
      }
      return NextResponse.json({ success: false, error: 'Test bulunamadı.' });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz işlem.' }, { status: 400 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    console.error('[trial-api] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
