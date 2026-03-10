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

const otpStore = new Map<string, OtpRecord>();

const PANEL_URL = process.env.PANEL_URL!;
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
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
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
          <p style="color:#9ca3af;font-size:14px">
            Bu kod 10 dakika boyunca geçerlidir.
          </p>
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
          <p style="color:#d1d5db;line-height:1.7">
            Aşağıdaki bilgileri IPTV uygulamanıza girerek testinizi başlatabilirsiniz.
          </p>

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

async function createTrialUser() {
  let browser: any = null;
  let trialPage: any = null;

  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless as any,
    });

    trialPage = await browser.newPage();

    // 1. Giriş İşlemi
    await trialPage.goto(`${PANEL_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 60000 });
    const needsLogin = await trialPage.evaluate(() => !!document.querySelector('input[type="password"]'));

    if (needsLogin) {
      await trialPage.type('input[name="username"], #username', PANEL_USER);
      await trialPage.type('input[name="password"], #password', PANEL_PASS);
      await Promise.all([
        trialPage.click('button[type="submit"], .btn-primary'),
        trialPage.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
    }

    // 2. Paket Oluşturma Sayfasına Git
    await trialPage.goto(`${PANEL_URL}/lines/create/1/line`, { waitUntil: 'networkidle2' });

    // --- ADIM 1: Seçeneklerin yüklenmesi için 2 saniye bekle ---
    await new Promise(r => setTimeout(r, 2000));

    // Paket Seçimi
    const pkgSelected = await trialPage.evaluate(() => {
      // id="package", name="package_id" veya direkt select etiketini ara
      const selectElement = document.querySelector('select[name="package_id"], select#package, select') as HTMLSelectElement;
      if (!selectElement) return false;

      const options = Array.from(selectElement.options);
      
      // 24 SAAT, 12 SAAT veya TEST içeren, boş olmayan ilk seçeneği bul
      const targetOption = options.find(o => 
        o.value && (o.text.toUpperCase().includes('24 SAAT') || o.text.toUpperCase().includes('12 SAAT') || o.text.toUpperCase().includes('TEST'))
      );

      if (targetOption) {
        selectElement.value = targetOption.value;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        
        // JQuery/Select2 desteği varsa tetikle
        const $ = (window as any).$;
        if ($ && $(selectElement).data('select2')) {
            $(selectElement).val(targetOption.value).trigger('change');
        }
        return true;
      }
      return false;
    });

    if (!pkgSelected) throw new Error('Uygun test paketi bulunamadı veya seçilemedi.');

    // --- ADIM 2: Paketi seçtikten sonra 5 Saniye Bekle ---
    await new Promise(r => setTimeout(r, 5000));

    // 3. Save Butonuna Tıkla
    await Promise.all([
      trialPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn'));
        const saveBtn = buttons.find((b: any) => 
          /save|kaydet|create/i.test(b.innerText || b.value) || b.classList.contains('btn-primary')
        );
        if (saveBtn) (saveBtn as HTMLElement).click();
      }),
      trialPage.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
    ]);

    // 4. Bilgileri Çekme (Lines Sayfası)
    await trialPage.goto(`https://pa.ipguzel.com/lines`, { waitUntil: 'networkidle2' });
    
    // Tablonun yüklenmesini bekle
    await trialPage.waitForSelector('table tbody tr', { timeout: 15000 });

    const credentials = await trialPage.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      if (rows.length === 0) return null;

      const cells = Array.from(rows[0].querySelectorAll('td'));
      
      // Kullanıcı adı (Index 1) - "TRIAL", "ISP OFF" gibi etiketleri atlamak için sadece ilk metni alıyoruz
      const rawUsername = cells[1]?.textContent?.trim() || "";
      const username = rawUsername.split(/\s+/)[0]; 

      // Şifre (Index 2)
      const password = cells[2]?.textContent?.trim() || "";

      return { username, password };
    });

    if (!credentials || !credentials.username || credentials.username.length < 3) {
      throw new Error('Kullanıcı listesinden bilgiler okunamadı.');
    }

    return credentials;
  } finally {
    if (browser) await browser.close();
  }
}

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
      otpStore.set(generatedToken, { email, otp: generatedOtp, expiresAt: Date.now() + 10 * 60 * 1000 });
      await sendOtpMail(email, generatedOtp);
      return NextResponse.json({ success: true, token: generatedToken });
    }

    if (action === 'verify') {
      const record = otpStore.get(token || '');
      if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
        return NextResponse.json({ success: false, error: 'Doğrulama başarısız veya süresi dolmuş.' }, { status: 400 });
      }

      otpStore.delete(token!);
      const creds = await createTrialUser();
      await sendTrialMail(email, creds.username!, creds.password!);

      return NextResponse.json({ success: true, ...creds });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Hata oluştu.' }, { status: 500 });
  }
}
