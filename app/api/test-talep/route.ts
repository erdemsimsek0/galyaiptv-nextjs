// v3 - production hardened
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

type OtpRecord = {
  email: string;
  otp: string;
  expiresAt: number;
  ip: string;
};

type TrialRecord = {
  email: string;
  ip: string;
  createdAt: number;
};

// ─── In-Memory Stores ─────────────────────────────────────────────────────────
// NOTE: For multi-instance deployments, replace these Maps with Redis.
// Keys: token → OtpRecord
const otpStore = new Map<string, OtpRecord>();

// Keys: email or ip → TrialRecord
// Persists for 7 days to block duplicate trial requests.
const trialStore = new Map<string, TrialRecord>();

// Cleanup interval: remove expired OTPs every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) otpStore.delete(key);
  }
}, 15 * 60 * 1000);

// Cleanup interval: remove expired trial records every hour
setInterval(() => {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  for (const [key, record] of trialStore.entries()) {
    if (now - record.createdAt > sevenDays) trialStore.delete(key);
  }
}, 60 * 60 * 1000);

// ─── Env ──────────────────────────────────────────────────────────────────────

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const TRIAL_SERVICE_URL = process.env.TRIAL_SERVICE_URL;
const TRIAL_API_SECRET = process.env.TRIAL_API_SECRET;

function assertEnv() {
  const missing = ['EMAIL_USER', 'EMAIL_PASS', 'TRIAL_SERVICE_URL', 'TRIAL_API_SECRET'].filter(
    (k) => !process.env[k]
  );
  if (missing.length > 0) {
    throw new Error(`Eksik environment değişkenleri: ${missing.join(', ')}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOtp(): string {
  // crypto.randomInt is cryptographically secure, unlike Math.random
  return crypto.randomInt(100000, 999999).toString();
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Timing-safe string comparison to prevent timing attacks on OTP verification.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Extract real IP from request, respecting common proxy headers.
 */
function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Check if an email or IP has already received a trial in the last 7 days.
 * Returns the existing TrialRecord if found, otherwise null.
 */
function findExistingTrial(email: string, ip: string): TrialRecord | null {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const byEmail = trialStore.get(`email:${email}`);
  if (byEmail && now - byEmail.createdAt < sevenDays) return byEmail;

  // Don't block by IP if it's "unknown" — could be misconfigured proxy
  if (ip !== 'unknown') {
    const byIp = trialStore.get(`ip:${ip}`);
    if (byIp && now - byIp.createdAt < sevenDays) return byIp;
  }

  return null;
}

function recordTrial(email: string, ip: string) {
  const record: TrialRecord = { email, ip, createdAt: Date.now() };
  trialStore.set(`email:${email}`, record);
  if (ip !== 'unknown') trialStore.set(`ip:${ip}`, record);
}

// ─── Mail ─────────────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

async function sendOtpMail(email: string, otp: string) {
  await createTransporter().sendMail({
    from: `"Galya IPTV" <${EMAIL_USER}>`,
    to: email,
    subject: 'Galya IPTV Doğrulama Kodunuz',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0b0b0f;padding:24px;color:#fff">
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
    `,
  });
}

async function sendTrialMail(email: string, username: string, password: string) {
  const m3u = `http://pro4kiptv.xyz:2086/get.php?username=${username}&password=${password}&type=m3u&output=ts`;
  const whatsappUrl = `https://wa.me/447441921660?text=Merhaba%2C%20test%20hesab%C4%B1m%C4%B1%20kulland%C4%B1m%20ve%20sat%C4%B1n%20almak%20istiyorum.`;

  await createTransporter().sendMail({
    from: `"Galya IPTV" <${EMAIL_USER}>`,
    to: email,
    subject: 'Galya IPTV Test Bilgileriniz Hazır',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background-color:#f7f9fc;border:1px solid #e0e6ed;">
        <div style="text-align:center;padding-bottom:20px;">
          <h1 style="color:#7c3aed;margin:0;font-size:28px;letter-spacing:1px;">Galya Media</h1>
          <p style="color:#666;margin:5px 0 0;font-size:14px;">Kaliteli IPTV Deneyimi</p>
        </div>
        <div style="background:linear-gradient(135deg,#512da8,#7c3aed);color:white;padding:30px;text-align:center;border-radius:8px;">
          <h2 style="margin:0;font-size:26px;">Test Hesabınız Hazır! 🎉</h2>
          <p style="font-size:15px;margin:15px 0;">12 saatlik premium test erişiminiz başladı.<br>Aşağıdaki bilgilerle hemen izlemeye başlayın.</p>
          <a href="${whatsappUrl}" style="background-color:#25d366;color:white;padding:12px 28px;text-decoration:none;border-radius:25px;font-weight:bold;font-size:15px;display:inline-block;margin-top:10px;">
            💬 WhatsApp ile Satın Al
          </a>
        </div>
        <div style="margin-top:20px;background-color:#fff;padding:20px;border-radius:8px;border:1px solid #e0e6ed;">
          <h3 style="color:#512da8;margin:0 0 15px;border-bottom:2px solid #7c3aed;padding-bottom:5px;font-size:18px;">Giriş Yöntemi 1: Xtream API</h3>
          <p style="color:#666;margin:0 0 15px;font-size:14px;">En yaygın yöntemdir. Uygulamanızda bu alanları doldurun.</p>
          <table style="width:100%;font-size:15px;border-collapse:collapse;">
            <tr><td style="width:35%;color:#888;padding:8px 0;"><strong>Sunucu:</strong></td><td style="font-family:monospace;color:#333;font-size:13px;">http://pro4kiptv.xyz:2086/</td></tr>
            <tr style="background-color:#f9f5ff;"><td style="color:#888;padding:8px;border-radius:4px 0 0 4px;"><strong>Kullanıcı Adı:</strong></td><td style="font-family:monospace;color:#512da8;font-size:14px;font-weight:bold;padding:8px;background:#f0ebff;border-radius:0 4px 4px 0;">${username}</td></tr>
            <tr><td style="color:#888;padding:8px 0;"><strong>Şifre:</strong></td><td style="font-family:monospace;color:#512da8;font-size:14px;font-weight:bold;padding:8px;background:#f0ebff;border-radius:4px;">${password}</td></tr>
          </table>
        </div>
        <div style="margin-top:16px;background-color:#fff;padding:20px;border-radius:8px;border:1px solid #e0e6ed;">
          <h3 style="color:#512da8;margin:0 0 15px;border-bottom:2px solid #7c3aed;padding-bottom:5px;font-size:18px;">Giriş Yöntemi 2: M3U Linki</h3>
          <p style="color:#666;margin:0 0 12px;font-size:14px;">Bazı uygulamalar için tek bir link kullanabilirsiniz.</p>
          <div style="background:#f0ebff;padding:12px;border-radius:6px;word-break:break-all;">
            <a href="${m3u}" style="color:#7c3aed;font-family:monospace;font-size:12px;text-decoration:none;">${m3u}</a>
          </div>
        </div>
        <div style="margin-top:20px;text-align:center;background:#fff;padding:16px;border-radius:8px;border:1px solid #e0e6ed;">
          <p style="font-size:15px;margin:0 0 6px;color:#333;"><strong>📱 Önerilen Uygulamalar</strong></p>
          <p style="font-size:14px;margin:0;color:#666;">IPTV Smarters &nbsp;•&nbsp; TiviMate &nbsp;•&nbsp; Hot IPTV</p>
        </div>
        <div style="margin-top:20px;background:linear-gradient(135deg,#512da8,#7c3aed);padding:24px;border-radius:8px;text-align:center;">
          <p style="color:white;font-size:16px;margin:0 0 16px;"><strong>Beğendiniz mi? Hemen satın alın! 🚀</strong></p>
          <p style="color:#e9d5ff;font-size:13px;margin:0 0 16px;">Paket seçenekleri ve fiyatlar için WhatsApp'tan bize ulaşın.</p>
          <a href="${whatsappUrl}" style="background-color:#25d366;color:white;padding:14px 32px;text-decoration:none;border-radius:25px;font-weight:bold;font-size:16px;display:inline-block;">
            💬 WhatsApp: +44 7441 921660
          </a>
        </div>
        <div style="text-align:center;margin-top:30px;border-top:1px solid #e0e6ed;padding-top:20px;">
          <p style="font-size:13px;color:#7c3aed;font-weight:bold;margin:0;">Galya Media</p>
          <p style="font-size:12px;color:#aaa;margin:6px 0 0;">© 2026 Galya Media. Tüm hakları saklıdır.</p>
          <p style="font-size:12px;color:#aaa;margin:4px 0 0;">Bu test hesabı 12 saat sonra otomatik devre dışı kalacaktır.</p>
        </div>
      </div>
    `,
  });
}

// ─── Trial Service ─────────────────────────────────────────────────────────────

async function createTrialUser(): Promise<{ username: string; password: string }> {
  const res = await fetch(`${TRIAL_SERVICE_URL}/create-trial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': TRIAL_API_SECRET!,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error(`Trial servisi HTTP ${res.status} döndürdü.`);
  }

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

    // ── Validate email for all actions ──
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Geçerli bir e-posta adresi girin.' },
        { status: 400 }
      );
    }

    // ── send_otp ──────────────────────────────────────────────────────────────
    if (action === 'send_otp') {
      // Check 7-day trial limit BEFORE sending OTP so user sees the message immediately
      const existing = findExistingTrial(email, ip);
      if (existing) {
        const daysAgo = Math.floor((Date.now() - existing.createdAt) / (1000 * 60 * 60 * 24));
        const daysLeft = 7 - daysAgo;
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

      otpStore.set(generatedToken, {
        email,
        otp: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000,
        ip,
      });

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

      const record = otpStore.get(token);

      if (!record) {
        return NextResponse.json(
          { success: false, error: 'Doğrulama kaydı bulunamadı veya süresi dolmuş.' },
          { status: 400 }
        );
      }

      if (record.email !== email) {
        return NextResponse.json(
          { success: false, error: 'E-posta eşleşmedi.' },
          { status: 400 }
        );
      }

      if (Date.now() > record.expiresAt) {
        otpStore.delete(token);
        return NextResponse.json(
          { success: false, error: 'Kodun süresi dolmuş. Lütfen yeni kod isteyin.' },
          { status: 400 }
        );
      }

      // Timing-safe OTP comparison
      if (!safeCompare(record.otp, otp)) {
        return NextResponse.json(
          { success: false, error: 'Doğrulama kodu hatalı.' },
          { status: 400 }
        );
      }

      // OTP verified — consume it immediately (prevent reuse)
      otpStore.delete(token);

      // Re-check trial limit at verify time too (race condition protection)
      const existing = findExistingTrial(email, ip);
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            alreadyUsed: true,
            error: 'Bu e-posta veya IP adresi ile daha önce test hesabı oluşturulmuş.',
          },
          { status: 429 }
        );
      }

      // Create trial account
      const creds = await createTrialUser();

      // Record this trial BEFORE sending mail (prevents double-issue on mail error)
      recordTrial(email, ip);

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
