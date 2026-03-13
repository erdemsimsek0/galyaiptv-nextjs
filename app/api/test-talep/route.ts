// v6 - rate limiting, disposable email block, VPN/proxy check, OTP hashing, credential recovery
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ─── Redis ────────────────────────────────────────────────────────────────────

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

async function redisSet(key: string, value: string, ttlSeconds: number) {
  await redis(['SET', key, value, 'EX', ttlSeconds]);
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

// ─── Types ────────────────────────────────────────────────────────────────────

type OtpRecord = {
  email: string;
  otpHash: string; // SHA-256 hash — düz metin değil
  ip: string;
  selectedPackage: string;
};

type TrialRecord = {
  email: string;
  ip: string;
  createdAt: number;
  selectedPackage: string;
  username: string;
  password: string;
};

// ─── Env ──────────────────────────────────────────────────────────────────────

function assertEnv() {
  const missing = [
    'EMAIL_USER', 'EMAIL_PASS',
    'TRIAL_SERVICE_URL', 'TRIAL_API_SECRET',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
  ].filter((k) => !process.env[k]);
  if (missing.length > 0) throw new Error(`Eksik env: ${missing.join(', ')}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Disposable Email Block ───────────────────────────────────────────────────
// Yaygın geçici mail domainleri listesi
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','temp-mail.org','throwaway.email',
  'yopmail.com','sharklasers.com','guerrillamailblock.com','grr.la',
  'guerrillamail.info','guerrillamail.biz','guerrillamail.de','guerrillamail.net',
  'guerrillamail.org','spam4.me','trashmail.com','trashmail.me','trashmail.at',
  'trashmail.io','trashmail.net','dispostable.com','mailnull.com','spamgourmet.com',
  'maildrop.cc','discard.email','tempr.email','discard.email','fakeinbox.com',
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

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW = 60;      // 60 saniye
const RATE_LIMIT_MAX = 2;          // pencere başına max istek
const RESEND_COOLDOWN = 60;        // tekrar gönder için bekleme (saniye)

async function checkRateLimit(ip: string): Promise<{ blocked: boolean; retryAfter?: number }> {
  if (ip === 'unknown') return { blocked: false };
  const key = `rate:otp:${ip}`;
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

// ─── VPN / Proxy / Datacenter Check ──────────────────────────────────────────

async function checkIpReputation(ip: string): Promise<{ blocked: boolean; reason?: string }> {
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
    return { blocked: false };
  }
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,proxy,hosting,mobile,query`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return { blocked: false }; // API hatasında geçir
    const data = await res.json();
    if (data.status !== 'success') return { blocked: false };
    if (data.proxy) return { blocked: true, reason: 'VPN/Proxy bağlantısı tespit edildi. Lütfen VPN kapatarak tekrar deneyin.' };
    if (data.hosting) return { blocked: true, reason: 'Veri merkezi bağlantısı tespit edildi. Lütfen normal internet bağlantınızla tekrar deneyin.' };
    return { blocked: false };
  } catch {
    return { blocked: false }; // Timeout veya hata — kullanıcıyı engelleme
  }
}

// ─── Trial Helpers ────────────────────────────────────────────────────────────

const TRIAL_TTL = 7 * 24 * 60 * 60; // 7 gün

async function findExistingTrial(email: string, ip: string): Promise<TrialRecord | null> {
  const byEmail = await redisGet(`trial:email:${email}`);
  if (byEmail) return JSON.parse(byEmail);
  if (ip !== 'unknown') {
    const byIp = await redisGet(`trial:ip:${ip}`);
    if (byIp) return JSON.parse(byIp);
  }
  return null;
}

async function recordTrial(
  email: string, ip: string, selectedPackage: string,
  username: string, password: string
) {
  const record: TrialRecord = { email, ip, createdAt: Date.now(), selectedPackage, username, password };
  const value = JSON.stringify(record);
  await redisSet(`trial:email:${email}`, value, TRIAL_TTL);
  if (ip !== 'unknown') await redisSet(`trial:ip:${ip}`, value, TRIAL_TTL);
}

// ─── OTP Helpers ─────────────────────────────────────────────────────────────

const OTP_TTL = 10 * 60; // 10 dakika

async function saveOtp(token: string, record: OtpRecord) {
  await redisSet(`otp:${token}`, JSON.stringify(record), OTP_TTL);
}
async function getOtp(token: string): Promise<OtpRecord | null> {
  const val = await redisGet(`otp:${token}`);
  return val ? JSON.parse(val) : null;
}
async function deleteOtp(token: string) { await redisDel(`otp:${token}`); }

// ─── Mail ─────────────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

async function sendOtpMail(email: string, otp: string) {
  await createTransporter().sendMail({
    from: `"Galya IPTV" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Galya IPTV Doğrulama Kodunuz',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0b0b0f;padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #7c3aed;border-radius:16px;padding:32px">
          <h2 style="margin:0 0 16px;color:#fff">E-posta Doğrulama Kodu</h2>
          <p style="color:#d1d5db;font-size:15px;line-height:1.6">Ücretsiz test talebinizi doğrulamak için:</p>
          <div style="margin:24px 0;padding:18px 24px;background:#1f2937;border-radius:12px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#a855f7">
            ${otp}
          </div>
          <p style="color:#9ca3af;font-size:14px">Bu kod 10 dakika geçerlidir.</p>
        </div>
      </div>`,
  });
}

async function sendTrialMail(email: string, username: string, password: string) {
  const m3u = `http://pro4kiptv.xyz:2086/get.php?username=${username}&password=${password}&type=m3u&output=ts`;
  const whatsappUrl = `https://wa.me/447441921660?text=Merhaba%2C%20test%20hesab%C4%B1m%C4%B1%20kulland%C4%B1m%20ve%20sat%C4%B1n%20almak%20istiyorum.`;

  await createTransporter().sendMail({
    from: `"Galya IPTV" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Galya IPTV Test Bilgileriniz Hazır',
    html: `
<!DOCTYPE html>
<html lang="tr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <style>
    :root { color-scheme: light only; }
    @media (prefers-color-scheme: dark) {
      .outer  { background-color:#f4f4f4 !important; }
      .card   { background-color:#ffffff !important; }
      .wbg    { background-color:#ffffff !important; }
      .lbg    { background-color:#f0ebff !important; }
      .tc     { color:#333333 !important; }
      .tm     { color:#555555 !important; }
      .tg     { color:#666666 !important; }
      .tp     { color:#512da8 !important; }
      .hl     { color:#512da8 !important; }
      .mono   { color:#333333 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;">
<div class="outer" style="background-color:#f4f4f4 !important;padding:24px 0;">
<div class="card" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#ffffff !important;border:1px solid #e0e6ed;border-radius:4px;" bgcolor="#ffffff">
  <div style="text-align:center;padding-bottom:20px;border-bottom:1px solid #e0e6ed;margin-bottom:20px;">
    <h1 style="color:#7c3aed !important;margin:0;font-size:28px;letter-spacing:1px;">Galya Media</h1>
    <p class="tg" style="color:#666666 !important;margin:5px 0 0;font-size:14px;">Kaliteli IPTV Deneyimi</p>
  </div>
  <div style="background:linear-gradient(135deg,#512da8,#7c3aed);padding:30px;text-align:center;border-radius:8px;">
    <h2 style="margin:0;font-size:26px;color:#ffffff !important;">Test Hesabınız Hazır! 🎉</h2>
    <p style="font-size:15px;margin:15px 0;color:#ffffff !important;">12 saatlik premium test erişiminiz başladı.</p>
    <a href="${whatsappUrl}" style="background-color:#25d366 !important;color:#ffffff !important;padding:12px 28px;text-decoration:none;border-radius:25px;font-weight:bold;font-size:15px;display:inline-block;margin-top:10px;">💬 WhatsApp ile Satın Al</a>
  </div>
  <div class="wbg" style="margin-top:20px;background-color:#ffffff !important;padding:20px;border-radius:8px;border:1px solid #e0e6ed;">
    <h3 class="tp" style="color:#512da8 !important;margin:0 0 15px;border-bottom:2px solid #7c3aed;padding-bottom:5px;font-size:18px;">Giriş Yöntemi 1: Xtream API</h3>
    <table style="width:100%;font-size:15px;border-collapse:collapse;" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:38%;padding:10px 8px 10px 0;"><span class="tg" style="color:#666666 !important;font-weight:bold;">Sunucu:</span></td>
        <td style="padding:10px 0;"><span class="mono" style="font-family:monospace;color:#333333 !important;font-size:13px;">http://pro4kiptv.xyz:2086/</span></td>
      </tr>
      <tr>
        <td class="lbg" style="background-color:#f0ebff !important;padding:10px 8px;border-radius:4px 0 0 4px;"><span class="tg" style="color:#666666 !important;font-weight:bold;">Kullanıcı Adı:</span></td>
        <td class="lbg" style="background-color:#f0ebff !important;padding:10px 8px;border-radius:0 4px 4px 0;"><span class="hl" style="font-family:monospace;color:#512da8 !important;font-size:15px;font-weight:bold;">${username}</span></td>
      </tr>
      <tr>
        <td style="padding:10px 8px 10px 0;"><span class="tg" style="color:#666666 !important;font-weight:bold;">Şifre:</span></td>
        <td class="lbg" style="background-color:#f0ebff !important;padding:10px 8px;border-radius:4px;"><span class="hl" style="font-family:monospace;color:#512da8 !important;font-size:15px;font-weight:bold;">${password}</span></td>
      </tr>
    </table>
  </div>
  <div class="wbg" style="margin-top:16px;background-color:#ffffff !important;padding:20px;border-radius:8px;border:1px solid #e0e6ed;">
    <h3 class="tp" style="color:#512da8 !important;margin:0 0 15px;border-bottom:2px solid #7c3aed;padding-bottom:5px;font-size:18px;">Giriş Yöntemi 2: M3U Linki</h3>
    <div class="lbg" style="background-color:#f0ebff !important;padding:12px;border-radius:6px;word-break:break-all;">
      <a href="${m3u}" style="color:#7c3aed !important;font-family:monospace;font-size:12px;text-decoration:none;">${m3u}</a>
    </div>
  </div>
  <div class="wbg" style="margin-top:20px;text-align:center;background-color:#ffffff !important;padding:16px;border-radius:8px;border:1px solid #e0e6ed;">
    <p class="tc" style="font-size:15px;margin:0 0 6px;color:#333333 !important;"><strong>📱 Önerilen Uygulamalar</strong></p>
    <p class="tg" style="font-size:14px;margin:0;color:#666666 !important;">IPTV Smarters &nbsp;•&nbsp; TiviMate &nbsp;•&nbsp; Hot IPTV</p>
  </div>
  <div style="margin-top:20px;background:linear-gradient(135deg,#512da8,#7c3aed);padding:24px;border-radius:8px;text-align:center;">
    <p style="color:#ffffff !important;font-size:16px;margin:0 0 16px;"><strong>Beğendiniz mi? Hemen satın alın! 🚀</strong></p>
    <a href="${whatsappUrl}" style="background-color:#25d366 !important;color:#ffffff !important;padding:14px 32px;text-decoration:none;border-radius:25px;font-weight:bold;font-size:16px;display:inline-block;">💬 WhatsApp: +44 7441 921660</a>
  </div>
  <div style="text-align:center;margin-top:30px;border-top:1px solid #e0e6ed;padding-top:20px;">
    <p style="font-size:13px;color:#7c3aed !important;font-weight:bold;margin:0;">Galya Media</p>
    <p class="tg" style="font-size:12px;color:#999999 !important;margin:6px 0 0;">© 2026 Galya Media. Tüm hakları saklıdır.</p>
    <p class="tg" style="font-size:12px;color:#999999 !important;margin:4px 0 0;">Bu test hesabı 12 saat sonra otomatik devre dışı kalacaktır.</p>
  </div>
</div>
</div>
</body>
</html>`,
  });
}

// ─── Trial Service ─────────────────────────────────────────────────────────────

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

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    assertEnv();
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, error: 'Geçersiz istek.' }, { status: 400 });

    const { action, email, otp, token, selectedPackage } = body as Record<string, string>;
    const ip = getIp(req);

    if (!email || !isValidEmail(email))
      return NextResponse.json({ success: false, error: 'Geçerli bir e-posta girin.' }, { status: 400 });

    // ── send_otp ──────────────────────────────────────────────────────────────
    if (action === 'send_otp') {

      // 1. Geçici mail kontrolü
      if (isDisposableEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Geçici e-posta adresleri kabul edilmemektedir. Lütfen kalıcı bir adres kullanın.' },
          { status: 400 }
        );
      }

      // 2. IP rate limiting
      const rateCheck = await checkRateLimit(ip);
      if (rateCheck.blocked) {
        return NextResponse.json(
          { success: false, error: `Çok fazla istek gönderildi. ${rateCheck.retryAfter} saniye bekleyin.`, retryAfter: rateCheck.retryAfter },
          { status: 429 }
        );
      }

      // 3. Resend cooldown (aynı email için)
      const cooldownCheck = await checkResendCooldown(email);
      if (cooldownCheck.blocked) {
        return NextResponse.json(
          { success: false, error: `Yeni kod göndermek için ${cooldownCheck.retryAfter} saniye bekleyin.`, retryAfter: cooldownCheck.retryAfter, cooldown: true },
          { status: 429 }
        );
      }

      // 4. VPN / Proxy / Datacenter kontrolü
      const ipCheck = await checkIpReputation(ip);
      if (ipCheck.blocked) {
        return NextResponse.json(
          { success: false, error: ipCheck.reason },
          { status: 403 }
        );
      }

      // 5. Daha önce test almış mı?
      const existing = await findExistingTrial(email, ip);
      if (existing) {
        const daysLeft = Math.ceil((TRIAL_TTL * 1000 - (Date.now() - existing.createdAt)) / 86400000);
        return NextResponse.json(
          {
            success: false,
            alreadyUsed: true,
            error: `Bu e-posta veya IP ile daha önce test oluşturulmuş. ${daysLeft} gün sonra tekrar deneyebilirsiniz.`,
          },
          { status: 429 }
        );
      }

      // 6. OTP oluştur ve hashle
      const generatedOtp = generateOtp();
      const generatedToken = generateToken();
      await saveOtp(generatedToken, {
        email,
        otpHash: hashOtp(generatedOtp),
        ip,
        selectedPackage: selectedPackage || 'Belirtilmedi',
      });
      await sendOtpMail(email, generatedOtp);

      return NextResponse.json({ success: true, token: generatedToken });
    }

    // ── verify ────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      if (!otp || !token)
        return NextResponse.json({ success: false, error: 'Kod veya token eksik.' }, { status: 400 });

      const record = await getOtp(token);
      if (!record)
        return NextResponse.json({ success: false, error: 'Doğrulama kodu süresi dolmuş. Yeni kod isteyin.' }, { status: 400 });
      if (record.email !== email)
        return NextResponse.json({ success: false, error: 'E-posta eşleşmedi.' }, { status: 400 });

      // Hash karşılaştırması
      const inputHash = hashOtp(otp);
      if (!safeCompare(record.otpHash, inputHash))
        return NextResponse.json({ success: false, error: 'Doğrulama kodu hatalı.' }, { status: 400 });

      await deleteOtp(token);

      // Race condition koruması
      const existing = await findExistingTrial(email, ip);
      if (existing) {
        return NextResponse.json(
          { success: false, alreadyUsed: true, error: 'Bu e-posta veya IP ile daha önce test oluşturulmuş.' },
          { status: 429 }
        );
      }

      const creds = await createTrialUser();
      await recordTrial(email, ip, record.selectedPackage, creds.username, creds.password);
      await sendTrialMail(email, creds.username, creds.password);

      return NextResponse.json({ success: true, username: creds.username, password: creds.password });
    }

    // ── recover: 12 saat içinde credentials'ı tekrar göster ──────────────────
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

      // Trial kaydını bul
      const trial = await findExistingTrial(email, ip);
      if (!trial || !trial.username) {
        return NextResponse.json(
          { success: false, error: 'Bu e-posta için aktif bir test kaydı bulunamadı.' },
          { status: 404 }
        );
      }

      // 12 saat içinde mi?
      const twelveHours = 12 * 60 * 60 * 1000;
      if (Date.now() - trial.createdAt > twelveHours) {
        return NextResponse.json(
          { success: false, error: 'Test hesabınızın süresi dolmuş. Yeni test için 7 gün beklemeniz gerekiyor.' },
          { status: 410 }
        );
      }

      return NextResponse.json({ success: true, username: trial.username, password: trial.password });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz işlem.' }, { status: 400 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    console.error('[trial-api] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
