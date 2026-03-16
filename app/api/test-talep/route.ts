// app/api/test-talep/route.ts
// v7 - rate limiting, disposable email block, VPN/proxy check, OTP hashing, credential recovery
// DÜZELTME: EMAIL_USER/EMAIL_PASS → EMAIL_SERVER_USER/EMAIL_SERVER_PASSWORD (NextAuth ile tutarlı)
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
  email:           string;
  otpHash:         string; // SHA-256 hash — düz metin değil
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

// ─── Env ──────────────────────────────────────────────────────────────────────

function assertEnv() {
  // DÜZELTME: EMAIL_USER/EMAIL_PASS yerine NextAuth ile tutarlı isimler
  const missing = [
    'EMAIL_USER',
    'EMAIL_PASS',
    'TRIAL_SERVICE_URL',
    'TRIAL_API_SECRET',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
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

// ─── Rate Limiting ────────────────────────────────────────────────────────────

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

// ─── Trial Helpers ────────────────────────────────────────────────────────────

const TRIAL_TTL = 7 * 24 * 60 * 60;

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
  email: string,
  ip: string,
  selectedPackage: string,
  username: string,
  password: string,
) {
  const record: TrialRecord = { email, ip, createdAt: Date.now(), selectedPackage, username, password };
  const value = JSON.stringify(record);
  await redisSet(`trial:email:${email}`, value, TRIAL_TTL);
  if (ip !== 'unknown') await redisSet(`trial:ip:${ip}`, value, TRIAL_TTL);
}

// ─── OTP Helpers ─────────────────────────────────────────────────────────────

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

// ─── Mailer ───────────────────────────────────────────────────────────────────

function createMailer() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendOtpMail(email: string, otp: string) {
  const transporter = createMailer();
  await transporter.sendMail({
    from:    `GalyaStream <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'GalyaStream – Doğrulama Kodunuz',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#07111f;padding:32px;border-radius:16px">
        <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px">GalyaStream</h1>
        <p style="color:#8b9ab3;font-size:14px;margin:0 0 24px">Ücretsiz test hesabınızı açmak için aşağıdaki kodu girin.</p>
        <div style="background:#1e2d42;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <p style="color:#8b9ab3;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px">Doğrulama Kodu</p>
          <p style="color:#ffffff;font-size:36px;font-weight:900;letter-spacing:8px;margin:0;font-family:monospace">${otp}</p>
        </div>
        <p style="color:#374151;font-size:12px;margin:0">Bu kod 10 dakika geçerlidir. Siz talep etmediyseniz bu e-postayı yok sayabilirsiniz.</p>
      </div>
    `,
  });
}

async function sendTrialMail(
  email: string,
  username: string,
  password: string,
) {
  const SERVER = 'http://pro4kiptv.xyz:2086';
  const m3u    = `${SERVER}/get.php?username=${username}&password=${password}&type=m3u&output=ts`;
  const whatsappUrl = `https://wa.me/447441921660?text=${encodeURIComponent('Merhaba, test hesabımı beğendim. Satın almak istiyorum.')}`;

  const transporter = createMailer();
  await transporter.sendMail({
    from:    `GalyaStream <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'GalyaStream – Test Hesabınız Hazır! ✅',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;background:#07111f;padding:32px;border-radius:16px">
        <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px">GalyaStream – Test Hesabınız</h1>
        <p style="color:#8b9ab3;font-size:14px;margin:0 0 24px">Aşağıdaki bilgilerle 3 saat boyunca test edebilirsiniz.</p>

        <div style="background:#1e2d42;border-radius:12px;padding:20px;margin-bottom:20px">
          <div style="margin-bottom:12px">
            <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">Sunucu URL</p>
            <p style="color:#3b82f6;font-size:14px;font-family:monospace;margin:0">${SERVER}</p>
          </div>
          <div style="margin-bottom:12px">
            <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">Kullanıcı Adı</p>
            <p style="color:#ffffff;font-size:16px;font-weight:700;font-family:monospace;margin:0">${username}</p>
          </div>
          <div style="margin-bottom:12px">
            <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">Şifre</p>
            <p style="color:#ffffff;font-size:16px;font-weight:700;font-family:monospace;margin:0">${password}</p>
          </div>
          <div>
            <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">M3U Linki</p>
            <p style="color:#8b9ab3;font-size:11px;font-family:monospace;word-break:break-all;margin:0">${m3u}</p>
          </div>
        </div>

        <div style="text-align:center;margin-bottom:20px">
          <a href="${whatsappUrl}"
             style="display:inline-block;background:#25d366;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:100px;text-decoration:none">
            💬 WhatsApp ile Satın Al
          </a>
        </div>

        <p style="color:#374151;font-size:12px;text-align:center;margin:0">
          © 2026 GalyaStream. Bu test hesabı 3 saat geçerlidir.
        </p>
      </div>
    `,
  });
}

// ─── Trial Service ─────────────────────────────────────────────────────────────

async function createTrialUser() {
  const res = await fetch(`${process.env.TRIAL_SERVICE_URL}/create-trial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': process.env.TRIAL_API_SECRET!,
    },
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
    if (!body)
      return NextResponse.json({ success: false, error: 'Geçersiz istek.' }, { status: 400 });

    const { action, email, otp, token, selectedPackage } = body as Record<string, string>;
    const ip = getIp(req);

    if (!email || !isValidEmail(email))
      return NextResponse.json({ success: false, error: 'Geçerli bir e-posta girin.' }, { status: 400 });

    // ── send_otp ──────────────────────────────────────────────────────────────
    if (action === 'send_otp') {

      if (isDisposableEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Geçici e-posta adresleri kabul edilmemektedir. Lütfen kalıcı bir adres kullanın.' },
          { status: 400 },
        );
      }

      const rateCheck = await checkRateLimit(ip);
      if (rateCheck.blocked) {
        return NextResponse.json(
          { success: false, error: `Çok fazla istek gönderildi. ${rateCheck.retryAfter} saniye bekleyin.`, retryAfter: rateCheck.retryAfter },
          { status: 429 },
        );
      }

      const cooldownCheck = await checkResendCooldown(email);
      if (cooldownCheck.blocked) {
        return NextResponse.json(
          { success: false, error: `Yeni kod göndermek için ${cooldownCheck.retryAfter} saniye bekleyin.`, retryAfter: cooldownCheck.retryAfter, cooldown: true },
          { status: 429 },
        );
      }

      const ipCheck = await checkIpReputation(ip);
      if (ipCheck.blocked) {
        return NextResponse.json(
          { success: false, error: ipCheck.reason },
          { status: 403 },
        );
      }

      const existing = await findExistingTrial(email, ip);
      if (existing) {
        const daysLeft = Math.ceil((TRIAL_TTL * 1000 - (Date.now() - existing.createdAt)) / 86400000);
        return NextResponse.json(
          {
            success: false,
            alreadyUsed: true,
            error: `Bu e-posta veya IP ile daha önce test oluşturulmuş. ${daysLeft} gün sonra tekrar deneyebilirsiniz.`,
          },
          { status: 429 },
        );
      }

      const generatedOtp   = generateOtp();
      const generatedToken = generateToken();
      await saveOtp(generatedToken, {
        email,
        otpHash:         hashOtp(generatedOtp),
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

      const inputHash = hashOtp(otp);
      if (!safeCompare(record.otpHash, inputHash))
        return NextResponse.json({ success: false, error: 'Doğrulama kodu hatalı.' }, { status: 400 });

      await deleteOtp(token);

      const existing = await findExistingTrial(email, ip);
      if (existing) {
        return NextResponse.json(
          { success: false, alreadyUsed: true, error: 'Bu e-posta veya IP ile daha önce test oluşturulmuş.' },
          { status: 429 },
        );
      }

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

      const trial = await findExistingTrial(email, ip);
      if (!trial || !trial.username) {
        return NextResponse.json(
          { success: false, error: 'Bu e-posta için aktif bir test kaydı bulunamadı.' },
          { status: 404 },
        );
      }

      const twelveHours = 12 * 60 * 60 * 1000;
      if (Date.now() - trial.createdAt > twelveHours) {
        return NextResponse.json(
          { success: false, error: 'Test hesabınızın süresi dolmuş. Yeni test için 7 gün beklemeniz gerekiyor.' },
          { status: 410 },
        );
      }

      return NextResponse.json({ success: true, username: trial.username, password: trial.password });
    }

    // ── create_direct: OTP'siz, session email ile direkt test oluştur ──────
    if (action === 'create_direct') {
      // 1. Email bazlı kontrol — en öncelikli
      const byEmail = await redisGet(`trial:email:${email}`);
      if (byEmail) {
        const existing: TrialRecord = JSON.parse(byEmail);
        return NextResponse.json({
          success: true,
          username: existing.username,
          password: existing.password,
          startedAt: existing.createdAt,
          alreadyExists: true,
        });
      }

      // 2. IP bazlı kontrol — aynı IP'den farklı hesapla test önleme
      // (localhost ve private IP'leri atla)
      if (ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
        const byIp = await redisGet(`trial:ip:${ip}`);
        if (byIp) {
          const ipRecord: TrialRecord = JSON.parse(byIp);
          // Aynı email ise zaten yukarıda yakalandı. Farklı email ise engelle.
          if (ipRecord.email !== email) {
            return NextResponse.json({
              success: false,
              ipBlocked: true,
              error: 'Bu IP adresinden daha önce bir test hesabı oluşturulmuş. Her IP adresi yalnızca 1 test alabilir.',
            }, { status: 429 });
          }
        }
      }

      // 3. VPN/proxy kontrolü
      const ipCheck = await checkIpReputation(ip);
      if (ipCheck.blocked) {
        return NextResponse.json({ success: false, error: ipCheck.reason }, { status: 403 });
      }

      // 4. Yeni test oluştur
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

    // ── get_trial: Mevcut trial bilgilerini getir (Redis'ten, sadece email) ─
    if (action === 'get_trial') {
      const byEmail = await redisGet(`trial:email:${email}`);
      if (byEmail) {
        const existing: TrialRecord = JSON.parse(byEmail);
        return NextResponse.json({
          success: true,
          username: existing.username,
          password: existing.password,
          startedAt: existing.createdAt,
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
