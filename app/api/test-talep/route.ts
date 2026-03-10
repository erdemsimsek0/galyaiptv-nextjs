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

          <div style="margin-top:20px;color:#9ca3af;font-size:14px;line-height:1.7">
            Uygulama olarak IPTV Smarters, TiviMate veya SS IPTV kullanabilirsiniz.
            Gereksiz/Spam klasörünü de kontrol etmeyi unutmayın.
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
      args: chromium.args,
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

    // 2. Paket Oluşturma Sayfası
    await trialPage.goto(`${PANEL_URL}/lines/create/1/line`, { waitUntil: 'networkidle2' });

    // Paket Seçimi (Daha garantici yöntem)
    const pkgSelected = await trialPage.evaluate(() => {
      const sel = document.querySelector('select') as HTMLSelectElement;
      if (!sel) return false;
      const opt = Array.from(sel.options).find(o => /12 saat|test|trial/i.test(o.text));
      if (opt) {
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        // Eğer Select2 kullanılıyorsa:
        const $ = (window as any).$;
        if ($ && $(sel).data('select2')) $(sel).trigger('change');
        return true;
      }
      return false;
    });

    if (!pkgSelected) throw new Error('12 Saatlik paket bulunamadı veya seçilemedi.');

    // 3. Kaydet ve Bekle
    await Promise.all([
      trialPage.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button, input[type="submit"]'))
          .find((b: any) => /save|kaydet|create/i.test(b.innerText || b.value));
        if (btn) (btn as HTMLElement).click();
      }),
      trialPage.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})
    ]);

    // 4. Bilgileri Çekme (Kritik Bölge)
    await trialPage.goto(`${PANEL_URL}/lines`, { waitUntil: 'networkidle2' });
    
    // Tablonun yüklenmesini bekle
    await trialPage.waitForSelector('table tbody tr', { timeout: 10000 });

    const credentials = await trialPage.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      if (rows.length === 0) return null;

      // En üstteki (en yeni) satırı al
      const firstRow = rows[0];
      const cells = Array.from(firstRow.querySelectorAll('td')).map(c => c.textContent?.trim() || "");

      // Sütun isimlerine göre bulmaya çalış (Index 1-2 genelde username/pass olur)
      // Panelinin yapısına göre burayı manuel kontrol etmen gerekebilir.
      return {
        username: cells[1] || null,
        password: cells[2] || null,
      };
    });

    if (!credentials || !credentials.username || credentials.username.length < 3) {
      throw new Error('Panel tablosunda kullanıcı bilgileri okunamadı.');
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
      return NextResponse.json(
        { success: false, error: 'Geçerli bir e-posta adresi girin.' },
        { status: 400 }
      );
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

      return NextResponse.json({
        success: true,
        token: generatedToken,
      });
    }

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
          { success: false, error: 'Doğrulama kaydı bulunamadı.' },
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
          { success: false, error: 'Kodun süresi dolmuş.' },
          { status: 400 }
        );
      }

      if (record.otp !== otp) {
        return NextResponse.json(
          { success: false, error: 'Doğrulama kodu hatalı.' },
          { status: 400 }
        );
      }

      otpStore.delete(token);

      const creds = await createTrialUser();

      if (!creds?.username || !creds?.password) {
        return NextResponse.json(
          { success: false, error: 'Panelden test hesabı oluşturulamadı.' },
          { status: 500 }
        );
      }

      await sendTrialMail(email, creds.username, creds.password);

      return NextResponse.json({
        success: true,
        username: creds.username,
        password: creds.password,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Geçersiz işlem.' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Sunucu hatası oluştu.',
      },
      { status: 500 }
    );
  }
}
