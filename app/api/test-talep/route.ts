import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import crypto from 'crypto';

type OtpRecord = {
  email: string;
  otp: string;
  expiresAt: number;
};

// In-memory store (Vercel gibi ortamlarda sıfırlanabilir, büyük projelerde Redis önerilir)
const otpStore = new Map<string, OtpRecord>();

// Çevresel değişkenlerden bilgileri al (Güvenlik için)
const PANEL_URL = process.env.PANEL_URL || 'https://pa.ipguzel.com';
const PANEL_USER = process.env.PANEL_USER || 'tly392';
const PANEL_PASS = process.env.PANEL_PASS || 'tly392++';

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
    html: `<div style="font-family:Arial;background:#0b0b0f;padding:24px;color:#fff">
            <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #7c3aed;border-radius:16px;padding:32px">
              <h2>Doğrulama Kodunuz</h2>
              <div style="margin:24px 0;padding:18px;background:#1f2937;text-align:center;font-size:32px;color:#a855f7;font-weight:bold">
                ${otp}
              </div>
            </div>
          </div>`,
  });
}

async function sendTrialMail(email: string, username: string, password: string) {
  const m3u = `http://pro4kiptv.xyz:2086/get.php?username=${username}&password=${password}&type=m3u&output=ts`;
  await transporter.sendMail({
    from: `"Galya IPTV" <${EMAIL_USER}>`,
    to: email,
    subject: 'Galya IPTV Test Bilgileriniz',
    html: `<div style="font-family:Arial;background:#0b0b0f;padding:24px;color:#fff">
            <div style="max-width:640px;margin:0 auto;background:#111827;border-radius:16px;padding:32px">
              <h2 style="color:#c084fc">Hesabınız Hazır</h2>
              <p><strong>Kullanıcı Adı:</strong> ${username}</p>
              <p><strong>Şifre:</strong> ${password}</p>
              <p><strong>M3U:</strong> ${m3u}</p>
            </div>
          </div>`,
  });
}

async function createTrialUser() {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    
    // 1. Dashboard'a git ve Giriş Yap
    await page.goto(`${PANEL_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 45000 });
    
    const needsLogin = await page.evaluate(() => !!document.querySelector('input[type="password"]'));
    if (needsLogin) {
      await page.type('input[name="username"]', PANEL_USER);
      await page.type('input[name="password"]', PANEL_PASS);
      await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
    }

    // 2. Line Oluşturma Sayfası
    await page.goto(`${PANEL_URL}/lines/create/1/line`, { waitUntil: 'networkidle2' });

    // Paket Seçimi (12 Saat Test)
    const pkgResult = await page.evaluate(() => {
      const select = document.querySelector('select') as HTMLSelectElement;
      if (!select) return false;
      const option = Array.from(select.options).find(o => /12 saat|test|trial/i.test(o.text));
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        // Select2 desteği
        const $ = (window as any).$;
        if ($ && $(select).data('select2')) $(select).trigger('change');
        return true;
      }
      return false;
    });

    if (!pkgResult) throw new Error("Paket seçilemedi.");
    await new Promise(r => setTimeout(r, 1000));

    // 3. Kaydet
    await Promise.all([
      page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button, input[type="submit"]'))
          .find((b: any) => /save|kaydet|create/i.test(b.innerText || b.value));
        if (btn) (btn as HTMLElement).click();
      }),
      page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
    ]);

    // 4. Bilgileri Çek (Lines Sayfası)
    await page.goto(`${PANEL_URL}/lines`, { waitUntil: 'networkidle2' });
    
    // Tablonun ve satırların yüklenmesi için bekle
    await page.waitForSelector('table tbody tr', { timeout: 15000 });
    
    const creds = await page.evaluate(() => {
      const firstRow = document.querySelector('table tbody tr');
      if (!firstRow) return null;
      const cells = Array.from(firstRow.querySelectorAll('td')).map(c => c.textContent?.trim());
      
      // Panel yapısına göre username 2. sütun (index 1), password 3. sütun (index 2)
      return {
        username: cells[1] || null,
        password: cells[2] || null
      };
    });

    if (!creds?.username) throw new Error("Panelden veriler okunamadı.");
    return creds;

  } finally {
    if (browser) await (browser as any).close();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, email, otp, token } = await req.json();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Geçersiz e-posta.' }, { status: 400 });
    }

    if (action === 'send_otp') {
      const generatedOtp = generateOtp();
      const generatedToken = generateToken();
      otpStore.set(generatedToken, { email, otp: generatedOtp, expiresAt: Date.now() + 600000 });
      await sendOtpMail(email, generatedOtp);
      return NextResponse.json({ success: true, token: generatedToken });
    }

    if (action === 'verify') {
      const record = otpStore.get(token);
      if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
        return NextResponse.json({ success: false, error: 'Kod hatalı veya süresi dolmuş.' }, { status: 400 });
      }

      otpStore.delete(token);
      const creds = await createTrialUser();
      await sendTrialMail(email, creds.username!, creds.password!);

      return NextResponse.json({ success: true, ...creds });
    }

    return NextResponse.json({ success: false, error: 'İşlem geçersiz.' }, { status: 400 });

  } catch (error: any) {
    console.error("HATA:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
