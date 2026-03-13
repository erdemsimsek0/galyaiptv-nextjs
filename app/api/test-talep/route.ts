// v7 - rate limiting, disposable email block, VPN/proxy check, OTP hashing, credential recovery
// sendTrialMail: yenilenmiş HTML şablonu (geri sayım, kopyala butonları, WhatsApp deep link)
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

const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX = 2;
const RESEND_COOLDOWN = 60;

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
    if (!res.ok) return { blocked: false };
    const data = await res.json();
    if (data.status !== 'success') return { blocked: false };
    if (data.proxy) return { blocked: true, reason: 'VPN/Proxy bağlantısı tespit edildi. Lütfen VPN kapatarak tekrar deneyin.' };
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
  email: string, ip: string, selectedPackage: string,
  username: string, password: string
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

// ─── Trial Mail (yenilenmiş şablon) ──────────────────────────────────────────
// Not: E-posta istemcileri JS çalıştırmaz. Geri sayım sayacı ve kopyala butonları
// için CSS-only animasyon + mailto: fallback kullanılmıştır.
// Gerçek etkileşimli versiyon için kullanıcıyı web paneline yönlendirin.

async function sendTrialMail(email: string, username: string, password: string) {
  const serverUrl = 'http://pro4kiptv.xyz:2086/';
  const m3u = `http://pro4kiptv.xyz:2086/get.php?username=${username}&password=${password}&type=m3u&output=ts`;
  const whatsappUrl = `https://wa.me/447441921660?text=Merhaba%2C%20test%20hesab%C4%B1m%C4%B1%20kulland%C4%B1m%20ve%20sat%C4%B1n%20almak%20istiyorum.`;

  await createTransporter().sendMail({
    from: `"Galya IPTV" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Galya IPTV — Test Hesabınız Hazır',
    html: `
<!DOCTYPE html>
<html lang="tr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    /* Force light mode in all clients */
    :root { color-scheme: light only; }
    @media (prefers-color-scheme: dark) {
      .outer { background-color: #f0eff5 !important; }
      .card  { background-color: #ffffff !important; }
      .sec   { background-color: #ffffff !important; border-color: #e0d9f5 !important; }
      .lbg   { background-color: #f3eeff !important; }
      .tc    { color: #1a1a2e !important; }
      .tm    { color: #444466 !important; }
      .tg    { color: #666688 !important; }
      .tp    { color: #5b21b6 !important; }
      .hl    { color: #5b21b6 !important; }
      .mono  { color: #2d1b6e !important; font-family: 'Courier New', Courier, monospace !important; }
      .wa-btn { background-color: #22c55e !important; }
      .cta-btn { background-color: #22c55e !important; }
    }

    /* CSS-only countdown animation (cosmetic — ≈12h display) */
    @keyframes tick {
      from { opacity: 1; }
      to   { opacity: 0.4; }
    }
    .timer-dot { animation: tick 1s infinite alternate; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0eff5;">

<div class="outer" style="background-color:#f0eff5;padding:32px 16px;">
<div class="card" style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.10);">

  <!-- ── HEADER ── -->
  <div style="background:linear-gradient(135deg,#1a0533 0%,#3b1278 50%,#6d28d9 100%);padding:36px 32px 32px;text-align:center;">
    <div style="font-family:Georgia,serif;font-size:30px;font-weight:700;color:#ffffff;letter-spacing:1px;margin-bottom:4px;">Galya Medya</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:20px;">Kaliteli IPTV Deneyimi</div>

    <!-- Active badge -->
    <div style="display:inline-block;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:100px;padding:6px 18px;margin-bottom:14px;">
      <span class="timer-dot" style="display:inline-block;width:7px;height:7px;background:#4ade80;border-radius:50%;vertical-align:middle;margin-right:6px;"></span>
      <span style="font-size:12px;color:rgba(255,255,255,0.85);font-weight:bold;vertical-align:middle;">Test erişiminiz aktif</span>
    </div>

    <div style="font-size:26px;font-weight:700;color:#ffffff;margin:4px 0 6px;">Hesabınız Hazır! 🎉</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.65);margin-bottom:20px;">12 saatlik premium test erişiminiz başladı.</div>

    <!-- Timer display (static — email clients don't run JS) -->
    <div style="display:inline-block;background:rgba(0,0,0,0.28);border:1px solid rgba(74,222,128,0.35);border-radius:10px;padding:12px 24px;">
      <div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Kalan Süre</div>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="text-align:center;background:rgba(255,255,255,0.1);border-radius:6px;padding:6px 12px;min-width:44px;">
            <div style="font-size:24px;font-weight:700;color:#4ade80;font-family:'Courier New',monospace;line-height:1;">12</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin-top:2px;">saat</div>
          </td>
          <td style="font-size:20px;font-weight:700;color:rgba(74,222,128,0.6);padding:0 6px;padding-bottom:10px;">:</td>
          <td style="text-align:center;background:rgba(255,255,255,0.1);border-radius:6px;padding:6px 12px;min-width:44px;">
            <div style="font-size:24px;font-weight:700;color:#4ade80;font-family:'Courier New',monospace;line-height:1;">00</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin-top:2px;">dak</div>
          </td>
          <td style="font-size:20px;font-weight:700;color:rgba(74,222,128,0.6);padding:0 6px;padding-bottom:10px;">:</td>
          <td style="text-align:center;background:rgba(255,255,255,0.1);border-radius:6px;padding:6px 12px;min-width:44px;">
            <div style="font-size:24px;font-weight:700;color:#4ade80;font-family:'Courier New',monospace;line-height:1;">00</div>
            <div style="font-size:9px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin-top:2px;">sn</div>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- ── BODY ── -->
  <div style="padding:28px 28px 8px;">

    <!-- Yöntem 1: Xtream API -->
    <div class="sec" style="background-color:#ffffff;border:1px solid #ede9fe;border-radius:12px;padding:20px;margin-bottom:18px;">
      <div style="display:inline-block;background:#ede9fe;color:#6d28d9;font-size:10px;font-weight:700;padding:3px 10px;border-radius:4px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Yöntem 1</div>
      <div class="tp" style="font-size:16px;font-weight:700;color:#5b21b6;margin-bottom:14px;border-bottom:1.5px solid #ede9fe;padding-bottom:8px;">Xtream API Bilgileri</div>

      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        <!-- Sunucu -->
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f0ff;width:36%;">
            <span class="tg" style="font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Sunucu</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f0ff;">
            <a href="${serverUrl}" style="font-family:'Courier New',Courier,monospace;font-size:12px;color:#7c3aed;text-decoration:none;">${serverUrl}</a>
          </td>
        </tr>
        <!-- Kullanıcı Adı -->
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f0ff;">
            <span class="tg" style="font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Kullanıcı Adı</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f0ff;">
            <div class="lbg" style="display:inline-block;background:#f3eeff;border-radius:6px;padding:5px 12px;">
              <span class="hl mono" style="font-family:'Courier New',Courier,monospace;font-size:15px;font-weight:700;color:#5b21b6;">${username}</span>
            </div>
          </td>
        </tr>
        <!-- Şifre -->
        <tr>
          <td style="padding:10px 0;">
            <span class="tg" style="font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Şifre</span>
          </td>
          <td style="padding:10px 0;">
            <div class="lbg" style="display:inline-block;background:#f3eeff;border-radius:6px;padding:5px 12px;">
              <span class="hl mono" style="font-family:'Courier New',Courier,monospace;font-size:15px;font-weight:700;color:#5b21b6;">${password}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Kopyala yönlendirmesi (email'de JS yok, mailto fallback) -->
      <div style="margin-top:14px;padding:10px 14px;background:#faf8ff;border-radius:8px;border:1px dashed #c4b5fd;">
        <span style="font-size:12px;color:#7c3aed;">💡 Bilgileri kopyalamak için bu e-postayı açık tutun veya</span>
        <a href="mailto:?subject=IPTV%20Bilgilerim&body=Kullanıcı%20Adı%3A%20${username}%0AŞifre%3A%20${password}%0ASunucu%3A%20${serverUrl}" style="font-size:12px;color:#7c3aed;font-weight:700;margin-left:4px;">kendinize iletin →</a>
      </div>
    </div>

    <!-- Yöntem 2: M3U -->
    <div class="sec" style="background-color:#ffffff;border:1px solid #ede9fe;border-radius:12px;padding:20px;margin-bottom:18px;">
      <div style="display:inline-block;background:#ede9fe;color:#6d28d9;font-size:10px;font-weight:700;padding:3px 10px;border-radius:4px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Yöntem 2</div>
      <div class="tp" style="font-size:16px;font-weight:700;color:#5b21b6;margin-bottom:14px;border-bottom:1.5px solid #ede9fe;padding-bottom:8px;">M3U Linki</div>
      <div class="lbg" style="background:#f3eeff;border-radius:8px;padding:14px;">
        <a href="${m3u}" style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#7c3aed;word-break:break-all;text-decoration:none;line-height:1.7;">${m3u}</a>
      </div>
    </div>

    <!-- Önerilen Uygulamalar -->
    <div class="sec" style="background-color:#ffffff;border:1px solid #ede9fe;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
      <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:10px;">📱 Önerilen Uygulamalar</div>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="padding:0 6px;">
            <div style="background:#f3eeff;border:1px solid #ddd6fe;border-radius:8px;padding:8px 16px;font-size:13px;color:#5b21b6;font-weight:600;">IPTV Smarters</div>
          </td>
          <td style="padding:0 6px;">
            <div style="background:#f3eeff;border:1px solid #ddd6fe;border-radius:8px;padding:8px 16px;font-size:13px;color:#5b21b6;font-weight:600;">TiviMate</div>
          </td>
          <td style="padding:0 6px;">
            <div style="background:#f3eeff;border:1px solid #ddd6fe;border-radius:8px;padding:8px 16px;font-size:13px;color:#5b21b6;font-weight:600;">Hot IPTV</div>
          </td>
        </tr>
      </table>
    </div>

  </div>

  <!-- ── CTA ── -->
  <div style="padding:0 28px 28px;">
    <div style="background:linear-gradient(135deg,#3b1278 0%,#6d28d9 100%);border-radius:14px;padding:24px;text-align:center;">
      <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-bottom:16px;">Beğendiniz mi? Hemen satın alın ve kesintisiz izlemeye devam edin.</div>
      <!-- WhatsApp deep link -->
      <a class="wa-btn" href="${whatsappUrl}"
         style="display:inline-flex;align-items:center;gap:8px;background-color:#25d366;color:#ffffff;font-size:15px;font-weight:700;padding:13px 30px;border-radius:100px;text-decoration:none;">
        <!-- WhatsApp SVG icon (base64 embedded for email compatibility) -->
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/120px-WhatsApp.svg.png"
             width="20" height="20" alt="WA" style="display:inline-block;vertical-align:middle;" />
        <span style="vertical-align:middle;">WhatsApp ile Satın Al</span>
      </a>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:10px;">+44 7441 921660</div>
    </div>
  </div>

  <!-- ── FOOTER ── -->
  <div style="text-align:center;padding:0 28px 28px;border-top:1px solid #f3f0ff;padding-top:20px;">
    <div style="font-size:14px;font-weight:700;color:#7c3aed;margin-bottom:4px;">Galya Medya</div>
    <div style="font-size:11px;color:#aaa;line-height:1.7;">
      © 2026 Galya Medya. Tüm hakları saklıdır.<br>
      Bu test hesabı 12 saat sonra otomatik olarak devre dışı kalacaktır.
    </div>
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

      if (isDisposableEmail(email)) {
        return NextResponse.json(
          { success: false, error: 'Geçici e-posta adresleri kabul edilmemektedir. Lütfen kalıcı bir adres kullanın.' },
          { status: 400 }
        );
      }

      const rateCheck = await checkRateLimit(ip);
      if (rateCheck.blocked) {
        return NextResponse.json(
          { success: false, error: `Çok fazla istek gönderildi. ${rateCheck.retryAfter} saniye bekleyin.`, retryAfter: rateCheck.retryAfter },
          { status: 429 }
        );
      }

      const cooldownCheck = await checkResendCooldown(email);
      if (cooldownCheck.blocked) {
        return NextResponse.json(
          { success: false, error: `Yeni kod göndermek için ${cooldownCheck.retryAfter} saniye bekleyin.`, retryAfter: cooldownCheck.retryAfter, cooldown: true },
          { status: 429 }
        );
      }

      const ipCheck = await checkIpReputation(ip);
      if (ipCheck.blocked) {
        return NextResponse.json(
          { success: false, error: ipCheck.reason },
          { status: 403 }
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
          { status: 429 }
        );
      }

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

      const inputHash = hashOtp(otp);
      if (!safeCompare(record.otpHash, inputHash))
        return NextResponse.json({ success: false, error: 'Doğrulama kodu hatalı.' }, { status: 400 });

      await deleteOtp(token);

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
          { status: 404 }
        );
      }

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
