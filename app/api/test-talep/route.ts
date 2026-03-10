import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

type OtpRecord = {
  email: string;
  otp: string;
  expiresAt: number;
};

const otpStore = new Map<string, OtpRecord>();

const PANEL_URL = process.env.PANEL_URL!;   // örn: https://pa.ipguzel.com
const PANEL_USER = process.env.PANEL_USER!;
const PANEL_PASS = process.env.PANEL_PASS!;

const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

async function sendOtpMail(email: string, otp: string) {
  await transporter.sendMail({
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
  await transporter.sendMail({
    from: `"Galya IPTV" <${EMAIL_USER}>`,
    to: email,
    subject: 'Galya IPTV Test Bilgileriniz Hazır',
    html: `
      <div style="font-family:Arial,sans-serif;background:#0b0b0f;padding:24px;color:#fff">
        <div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #7c3aed;border-radius:16px;padding:32px">
          <h2 style="margin:0 0 16px;color:#fff">12 Saatlik Test Hesabınız Hazır</h2>
          <p style="color:#d1d5db;line-height:1.7">Aşağıdaki bilgileri IPTV uygulamanıza girerek testinizi başlatabilirsiniz.</p>
          <div style="margin-top:24px;background:#1f2937;border-radius:12px;padding:20px">
            <h3 style="margin:0 0 14px;color:#c084fc">Xtream API</h3>
            <p style="margin:8px 0;color:#e5e7eb"><strong>Sunucu:</strong> http://pro4kiptv.xyz:2086/</p>
            <p style="margin:8px 0;color:#e5e7eb"><strong>Kullanıcı Adı:</strong> ${username}</p>
            <p style="margin:8px 0;color:#e5e7eb"><strong>Şifre:</strong> ${password}</p>
          </div>
          <div style="margin-top:20px;background:#1f2937;border-radius:12px;padding:20px">
            <h3 style="margin:0 0 14px;color:#c084fc">M3U Linki</h3>
            <p style="margin:0;color:#e5e7eb;word-break:break-all">${m3u}</p>
          </div>
        </div>
      </div>
    `,
  });
}

// ─── Panel API Yardımcıları ───────────────────────────────────────────────────

/**
 * Panel'e login olup session cookie döner.
 */
async function panelLogin(): Promise<string> {
  const url = `${PANEL_URL}/api/login`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: PANEL_USER, password: PANEL_PASS }),
    redirect: 'manual',
  });

  // Cookie'yi al
  const setCookie = res.headers.get('set-cookie') || '';
  const sessionMatch = setCookie.match(/(PHPSESSID|laravel_session|remember_web_[^=]*)=([^;]+)/i);
  if (sessionMatch) return `${sessionMatch[1]}=${sessionMatch[2]}`;

  // Bazı paneller token döner
  try {
    const data = await res.json();
    if (data?.token) return `token=${data.token}`;
    if (data?.data?.token) return `token=${data.data.token}`;
  } catch (_) {}

  throw new Error('Panel login başarısız: cookie veya token alınamadı.');
}

/**
 * Mevcut paketleri çekip TEST/12 SAAT/24 SAAT içeren ilk paketin ID'sini döner.
 */
async function getTestPackageId(cookie: string): Promise<string> {
  // XtreamCodes standart endpoint'leri
  const endpoints = [
    '/api/packages',
    '/api/get_packages',
    '/packages/list',
    '/api/v1/packages',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${PANEL_URL}${ep}`, {
        headers: { Cookie: cookie, Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const data = await res.json();

      // Farklı panel yapılarına göre array bul
      const list: any[] = Array.isArray(data)
        ? data
        : data?.data ?? data?.packages ?? data?.result ?? [];

      const pkg = list.find((p: any) => {
        const name: string = p?.package_name ?? p?.name ?? p?.title ?? '';
        return /12 SAAT|24 SAAT|TEST/i.test(name);
      });

      if (pkg) {
        const id = pkg?.id ?? pkg?.package_id ?? pkg?._id;
        console.log(`Package found via ${ep}: id=${id}, name=${pkg.package_name ?? pkg.name}`);
        return String(id);
      }
    } catch (e) {
      console.log(`${ep} failed:`, e);
    }
  }

  throw new Error('Test paketi API üzerinden bulunamadı.');
}

/**
 * Trial kullanıcı oluşturur, { username, password } döner.
 */
async function createTrialUserViaApi(): Promise<{ username: string; password: string }> {
  // 1. Login
  const cookie = await panelLogin();
  console.log('Login OK, cookie:', cookie.substring(0, 30));

  // 2. Paket ID'si
  const packageId = await getTestPackageId(cookie);

  // 3. Trial user oluştur
  const createEndpoints = [
    { url: '/api/lines/create', method: 'POST' },
    { url: '/api/create_trial',  method: 'POST' },
    { url: '/lines/store',       method: 'POST' },
    { url: '/api/v1/lines',      method: 'POST' },
  ];

  const payload = {
    package_id: packageId,
    line_type: 1,       // 1 = Line
    isp_lock: 0,
    country_lock: 1,
  };

  for (const ep of createEndpoints) {
    try {
      const res = await fetch(`${PANEL_URL}${ep.url}`, {
        method: ep.method,
        headers: {
          Cookie: cookie,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log(`${ep.url} response (${res.status}):`, text.substring(0, 300));

      if (!res.ok) continue;

      let data: any;
      try { data = JSON.parse(text); } catch (_) { continue; }

      // Farklı response yapıları
      const username =
        data?.username ?? data?.data?.username ?? data?.line?.username ?? data?.user?.username;
      const password =
        data?.password ?? data?.data?.password ?? data?.line?.password ?? data?.user?.password;

      if (username && password) {
        return { username: String(username), password: String(password) };
      }

      // Bazı paneller sadece id döner, lines listesinden çek
      const lineId = data?.id ?? data?.data?.id ?? data?.line_id;
      if (lineId) {
        return await getLineById(cookie, String(lineId));
      }
    } catch (e) {
      console.log(`${ep.url} error:`, e);
    }
  }

  // 4. Hiçbir create endpoint çalışmadıysa lines listesinin başından al
  console.log('Create endpoints failed, falling back to lines list...');
  return await getLatestLine(cookie);
}

/**
 * Belirli bir line ID'sinden username/password çeker.
 */
async function getLineById(
  cookie: string,
  lineId: string
): Promise<{ username: string; password: string }> {
  const res = await fetch(`${PANEL_URL}/api/lines/${lineId}`, {
    headers: { Cookie: cookie, Accept: 'application/json' },
  });
  const data = await res.json();
  const username = data?.username ?? data?.data?.username;
  const password = data?.password ?? data?.data?.password;
  if (!username) throw new Error('Line detayı alınamadı.');
  return { username: String(username), password: String(password) };
}

/**
 * Lines listesinin ilk satırından (en son eklenen) credentials alır.
 */
async function getLatestLine(cookie: string): Promise<{ username: string; password: string }> {
  const endpoints = [
    '/api/lines?page=1&limit=1&order=id&dir=desc',
    '/api/lines?per_page=1',
    '/api/get_lines',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${PANEL_URL}${ep}`, {
        headers: { Cookie: cookie, Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const list: any[] = Array.isArray(data)
        ? data
        : data?.data ?? data?.lines ?? data?.result ?? [];

      if (list.length > 0) {
        const line = list[0];
        const username = line?.username ?? line?.user;
        const password = line?.password ?? line?.pass;
        if (username && password) return { username: String(username), password: String(password) };
      }
    } catch (e) {
      console.log(`${ep} error:`, e);
    }
  }

  throw new Error('Lines listesinden kullanıcı bilgisi alınamadı.');
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, otp, token } = body || {};

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Geçersiz e-posta.' }, { status: 400 });
    }

    if (action === 'send_otp') {
      const generatedOtp = generateOtp();
      const generatedToken = generateToken();
      otpStore.set(generatedToken, {
        email,
        otp: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      await sendOtpMail(email, generatedOtp);
      return NextResponse.json({ success: true, token: generatedToken });
    }

    if (action === 'verify') {
      const record = otpStore.get(token || '');
      if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
        return NextResponse.json(
          { success: false, error: 'Doğrulama başarısız veya süresi dolmuş.' },
          { status: 400 }
        );
      }

      otpStore.delete(token!);
      const creds = await createTrialUserViaApi();
      await sendTrialMail(email, creds.username, creds.password);

      return NextResponse.json({ success: true, ...creds });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Hata oluştu.' },
      { status: 500 }
    );
  }
}
