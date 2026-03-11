// v4 - upstash redis
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ─── Redis Client (Upstash REST) ──────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type OtpRecord = {
  email: string;
  otp: string;
  ip: string;
};

type TrialRecord = {
  email: string;
  ip: string;
  createdAt: number;
};

// ─── Env Check ────────────────────────────────────────────────────────────────

function assertEnv() {
  const missing = [
    'EMAIL_USER',
    'EMAIL_PASS',
    'TRIAL_SERVICE_URL',
    'TRIAL_API_SECRET',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Eksik environment değişkenleri: ${missing.join(', ')}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

// ─── Trial Helpers ────────────────────────────────────────────────────────────

const TRIAL_TTL = 7 * 24 * 60 * 60; // 7 gün saniye cinsinden

async function findExistingTrial(email: string, ip: string): Promise<TrialRecord | null> {
  const byEmail = await redisGet(`trial:email:${email}`);
  if (byEmail) return JSON.parse(byEmail) as TrialRecord;

  if (ip !== 'unknown') {
    const byIp = await redisGet(`trial:ip:${ip}`);
    if (byIp) return JSON.parse(byIp) as TrialRecord;
  }

  return null;
}

async function recordTrial(email: string, ip: string) {
  const record: TrialRecord = { email, ip, createdAt: Date.now() };
  const value = JSON.stringify(record);
  await redisSet(`trial:email:${email}`, value, TRIAL_TTL);
  if (ip !== 'unknown') {
    await redisSet(`trial:ip:${ip}`, value, TRIAL_TTL);
  }
}

// ─── OTP Helpers ─────────────────────────────────────────────────────────────

const OTP_TTL = 10 * 60; // 10 dakika

async function saveOtp(token: string, record: OtpRecord) {
  await redisSet(`otp:${token}`, JSON.stringify(record), OTP_TTL);
}

async function getOtp(token: string): Promise<OtpRecord | null> {
  const val = await redisGet(`otp:${token}`);
  return val ? (JSON.parse(val) as OtpRecord) : null;
}

async function deleteOtp(token: string) {
  await redisDel(`otp:${token}`);
}

// ─── Mail ─────────────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendOtpMail(email: string, otp: string) {
  await createTransporter().sendMail({
    from: `"Galya IPTV" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Galya IPTV Doğrulama Kodunuz',
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
      </head>
      <body style="margin:0; padding:20px; background-color:#f3f4f6;">
        <div style="font-family:Arial,sans-serif;background:#0b0b0f;padding:24px;color:#fff; border-radius:16px;">
          <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #7c3aed;border-radius:16px;padding:32px">
            <h2 style="margin:0 0 16px;color:#fff">E-posta Doğrulama Kodu</h2>
            <p style="color:#d1d5db;font-size:15px;line-height:1.6">
              Ücretsiz test talebinizi doğrulamak için aşağıdaki 6 haneli kodu kullanın:
            </p>
            <div style="margin:24px 0;padding:18px 24px;background:#1f2937;border-radius:12px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#a855f7">
              ${otp}
            </div>
            <p style="color:#9ca3af;font-size:14px">Bu kod 10 dakika boyunca geçerlidir.</p>
          </div>
        </div>
      </body>
      </html>
    `,
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
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
        <style>
          /* Karanlık mod zorlamalarını ezmek için basit CSS */
          :root { color-scheme: light; }
        </style>
      </head>
      <body style="margin:0; padding:20px; background-color:#f3f4f6;">
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#ffffff !important;border:1px solid #e0e6ed; color:#333333;">

          <div style="text-align:center;padding-bottom:20px;border-bottom:1px solid #e0e6ed;margin-bottom:20px;">
            <h1 style="color:#7c3aed;margin:0;font-size:28px;letter-spacing:1px;">Galya Media</h1>
            <p style="color:#666666;margin:5px 0 0;font-size:14px;">Kaliteli IPTV Deneyimi</p>
          </div>

          <div style="background:linear-gradient(135deg,#512da8,#7c3aed);color:#ffffff;padding:30px;text-align:center;border-radius:8px;">
            <h2 style="margin:0;font-size:26px;color:#ffffff;">Test Hesabınız Hazır! 🎉</h2>
            <p style="font-size:15px;margin:15px 0;color:#ffffff;">12 saatlik premium test erişiminiz başladı.<br>Aşağıdaki bilgilerle hemen izlemeye başlayın.</p>
            <a href="${whatsappUrl}" style="background-color:#25d366;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:25px;font-weight:bold;font-size:15px;display:inline-block;margin-top:10px;">
              💬 WhatsApp ile Satın Al
            </a>
          </div>

          <div style="margin-top:20px;background-color:#ffffff;padding:20px;border-radius:8px;border:1px solid #e0e6ed;">
            <h3 style="color:#512da8;margin:0 0 15px;border-bottom:2px solid #7c3aed;padding-bottom:5px;font-size:18px;">Giriş Yöntemi 1: Xtream API</h3>
            <p style="color:#555555;margin:0 0 15px;font-size:14px;">En yaygın yöntemdir. Uygulamanızda bu alanları doldurun.</p>
            <table style="width:100%;font-size:15px;border-collapse:collapse;">
              <tr>
                <td style="width:35%;color:#666666;padding:8px 0;"><strong>Sunucu:</strong></td>
                <td style="font-family:monospace;color:#333333;font-size:13px;">http://pro4kiptv.xyz:2086/</td>
              </tr>
              <tr style="background-color:#f9f5ff;">
                <td style="color:#666666;padding:8px;border-radius:4px 0 0 4px;"><strong>Kullanıcı Adı:</strong></td>
                <td style="font-family:monospace;color:#512da8;font-size:14px;font-weight:bold;padding:8px;background:#f0ebff;border-radius:0 4px 4px 0;">${username}</td>
              </tr>
              <tr>
                <td style="color:#666666;padding:8px 0;"><strong>Şifre:</strong></td>
                <td style="font-family:monospace;color:#512da8;font-size:14px;font-weight:bold;padding:8px;background:#f0ebff;border-radius:4px;">${password}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top:16px;background-color:#ffffff;padding:20px;border-radius:8px;border:1px solid #e0e6ed;">
            <h3 style="color:#512da8;margin:0 0 15px;border-bottom:2px solid #7c3aed;padding-bottom:5px;font-size:18px;">Giriş Yöntemi 2: M3U Linki</h3>
            <p style="color:#555555;margin:0 0 12px;font-size:14px;">M3U destekleyen uygulamalar için aşağıdaki linki kullanın. <em>(Kopyalamak için linkin üzerine basılı tutun)</em></p>
            <div style="background:#f0ebff;padding:16px;border-radius:6px;word-break:break-all;border:2px dashed #a855f7;text-align:center;">
              <a href="${m3u}" style="color:#7c3aed;font-family:monospace;font-size:13px;text-decoration:none;display:block;font-weight:bold;">${m3u}</a>
            </div>
          </div>

          <div style="margin-top:20px;text-align:center;background:#ffffff;padding:16px;border-radius:8px;border:1px solid #e0e6ed;">
            <p style="font-size:15px;margin:0 0 6px;color:#333333;"><strong>📱 Önerilen Uygulamalar</strong></p>
            <p style="font-size:14px;margin:0;color:#666666;">IPTV Smarters &nbsp;•&nbsp; TiviMate &nbsp;•&nbsp; Hot IPTV</p>
          </div>

          <div style="margin-top:20px;background:linear-gradient(135deg,#512da8,#7c3aed);padding:24px;border-radius:8px;text-align:center;">
            <p style="color:#ffffff;font-size:16px;margin:0 0 16px;"><strong>Beğendiniz mi? Hemen satın alın! 🚀</strong></p>
            <p style="color:#e9d5ff;font-size:13px;margin:0 0 16px;">Paket seçenekleri ve fiyatlar için WhatsApp'tan bize ulaşın.</p>
            <a href="${whatsappUrl}" style="background-color:#25d366;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:25px;font-weight:bold;font-size:16px;display:inline-block;">
              💬 WhatsApp: +44 7441 921660
            </a>
          </div>

          <div style="text-align:center;margin-top:30px;border-top:1px solid #e0e6ed;padding-top:20px;">
            <p style="font-size:13px;color:#7c3aed;font-weight:bold;margin:0;">Galya Media</p>
            <p style="font-size:12px;color:#999999;margin:6px 0 0;">© 2026 Galya Media. Tüm hakları saklıdır.</p>
            <p style="font-size:12px;color:#999999;margin:4px 0 0;">Bu test hesabı 12 saat sonra otomatik devre dışı kalacaktır.</p>
          </div>

        </div>
      </body>
      </html>
    `,
  });
}

// ─── Trial Service ─────────────────────────────────────────────────────────────

async function createTrialUser(): Promise<{ username: string; password: string }> {
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
  if (!data.success || !data.username || !data.password) {
    throw new Error(data.error || 'Trial servisi geçersiz yanıt döndürdü.');
  }

  return { username: data.username, password: data.password };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    assertEnv();

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Geçersiz istek gövdesi.' }, { status: 400 });
    }

    const { action, email, otp, token } = body as Record<string, string>;
    const ip = getIp(req);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir e-posta adresi girin.' },
        { status: 400 }
      );
    }

    // ── send_otp ──────────────────────────────────────────────────────────────
    if (action === 'send_otp') {
      const existing = await findExistingTrial(email, ip);
      if (existing) {
        const daysLeft = Math.ceil(
          (TRIAL_TTL * 1000 - (Date.now() - existing.createdAt)) / (1000 * 60 * 60 * 24)
        );
        return NextResponse.json(
          {
            success: false,
            alreadyUsed: true,
            error: `Bu e-posta veya IP adresi ile daha önce test hesabı oluşturulmuş. ${daysLeft} gün sonra tekrar deneyebilirsiniz.`,
          },
          { status: 429 }
        );
      }

      const generatedOtp = generateOtp();
      const generatedToken = generateToken();

      await saveOtp(generatedToken, { email, otp: generatedOtp, ip });
      await sendOtpMail(email, generatedOtp);

      return NextResponse.json({ success: true, token: generatedToken });
    }

    // ── verify ────────────────────────────────────────────────────────────────
    if (action === 'verify') {
      if (!otp || !token) {
        return NextResponse.json(
          { success: false, error: 'Kod veya token eksik.' },
          { status: 400 }
        );
      }

      const record = await getOtp(token);

      if (!record) {
        return NextResponse.json(
          { success: false, error: 'Doğrulama kodu süresi dolmuş. Lütfen yeni kod isteyin.' },
          { status: 400 }
        );
      }

      if (record.email !== email) {
        return NextResponse.json(
          { success: false, error: 'E-posta eşleşmedi.' },
          { status: 400 }
        );
      }

      if (!safeCompare(record.otp, otp)) {
        return NextResponse.json(
          { success: false, error: 'Doğrulama kodu hatalı.' },
          { status: 400 }
        );
      }

      // OTP doğru — hemen sil (tekrar kullanım engeli)
      await deleteOtp(token);

      // Race condition koruması
      const existing = await findExistingTrial(email, ip);
      if (existing) {
        return NextResponse.json(
          { success: false, alreadyUsed: true, error: 'Bu e-posta veya IP ile daha önce test hesabı oluşturulmuş.' },
          { status: 429 }
        );
      }

      const creds = await createTrialUser();

      // Önce kaydet, sonra mail at (çift hesap engellemek için)
      await recordTrial(email, ip);
      await sendTrialMail(email, creds.username, creds.password);

      return NextResponse.json({
        success: true,
        username: creds.username,
        password: creds.password,
      });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz işlem.' }, { status: 400 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası oluştu.';
    console.error('[trial-api] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
