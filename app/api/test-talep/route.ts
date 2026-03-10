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

const PANEL_URL  = process.env.PANEL_URL!;   // https://pa.ipguzel.com
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

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function createTrialUser(): Promise<{ username: string; password: string }> {
  let browser: any = null;

  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless as any,
    });

    const trialPage = await browser.newPage();

    // 1. Dashboard'a git — login gerekiyor mu kontrol et
    await trialPage.goto(`${PANEL_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 60000 });

    const needsLogin = await trialPage.evaluate(() => !!document.querySelector('input[type="password"]'));
    if (needsLogin) {
      const userField = await trialPage.$('input[name="username"], #username, input[type="text"]');
      const passField = await trialPage.$('input[name="password"], #password, input[type="password"]');
      if (userField) { await (userField as any).click({ clickCount: 3 }); await (userField as any).type(PANEL_USER); }
      if (passField) { await (passField as any).click({ clickCount: 3 }); await (passField as any).type(PANEL_PASS); }
      await trialPage.keyboard.press('Enter');
      await trialPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      await delay(2000);
    }

    // 2. Trial oluşturma sayfasına git
    await trialPage.goto(`${PANEL_URL}/lines/create/1/line`, { waitUntil: 'networkidle2', timeout: 20000 });
    await delay(1500);

    // 3. Country Lock checkbox'ı kapat (bot ile aynı)
    await trialPage.evaluate(() => {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      for (const cb of Array.from(checkboxes) as HTMLInputElement[]) {
        const label = (cb.closest('label') || cb.parentElement || {} as any).innerText || '';
        if (/country.?lock/i.test(label) && cb.checked) cb.click();
      }
    });
    await delay(500);

    // 4. Paket seçimi — bot.js ile BİREBİR AYNI mantık
    const pkgResult: string = await trialPage.evaluate(() => {
      // Önce native <select> dene
      const selects = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[];
      for (const sel of selects) {
        const opts = Array.from(sel.options);
        const opt = opts.find(o => /12 saat/i.test(o.text));
        if (opt) {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          return 'done';
        }
      }
      // Select2 varsa son .select2-selection--single'ı tıkla
      const sel2s = document.querySelectorAll('.select2-selection--single');
      if (sel2s.length) {
        (sel2s[sel2s.length - 1] as HTMLElement).click();
        return 'select2';
      }
      return 'notfound';
    });

    console.log('pkgResult:', pkgResult);

    if (pkgResult === 'select2') {
      // Dropdown açılması için bekle (bot 800ms kullanıyor)
      await delay(800);

      const found: boolean = await trialPage.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.select2-results__option'));
        const item = items.find((i: any) => /12 saat/i.test(i.innerText || i.textContent));
        if (item) { (item as HTMLElement).click(); return true; }
        return false;
      });

      if (!found) {
        // Search input'a yaz (bot ile aynı fallback)
        await trialPage.keyboard.type('12');
        await delay(600);
        await trialPage.evaluate(() => {
          const item = Array.from(document.querySelectorAll('.select2-results__option'))
            .find((i: any) => /12 saat/i.test(i.innerText || i.textContent));
          if (item) (item as HTMLElement).click();
        });
      }
    } else if (pkgResult === 'notfound') {
      throw new Error('Package dropdown bulunamadı');
    }

    // 5. Seçim sonrası bekle
    await delay(800);

    // 6. Save butonuna tıkla (bot ile aynı)
    await trialPage.evaluate(() => {
      const btn = Array.from(
        document.querySelectorAll('button[type="submit"], input[type="submit"], button')
      ).find((b: any) => /save|kaydet/i.test(b.innerText || b.value || b.textContent));
      if (btn) (btn as HTMLElement).click();
    });

    await trialPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
    await delay(5000);

    // 7. Lines sayfasından credentials al (bot ile aynı)
    await trialPage.goto(`${PANEL_URL}/lines`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    const credentials: { username: string | null; password: string | null } | null =
      await trialPage.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr');
        if (!rows.length) return null;

        const firstRow = rows[0];
        const cells = firstRow.querySelectorAll('td');
        const headers = Array.from(document.querySelectorAll('table thead th'));

        let usernameIdx = -1;
        let passwordIdx = -1;
        headers.forEach((th, i) => {
          const t = ((th as any).innerText || '').toLowerCase();
          if (t.includes('username')) usernameIdx = i;
          if (t.includes('password')) passwordIdx = i;
        });

        function cleanCell(cell: Element | null) {
          if (!cell) return null;
          for (const node of Array.from(cell.childNodes)) {
            if (node.nodeType === Node.TEXT_NODE) {
              const t = (node.textContent || '').trim();
              if (t) return t;
            }
          }
          return (cell as any).innerText
            .replace(/TRIAL|ALMOST EXPIRED|EXPIRED|ALMOST/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        }

        return {
          username: usernameIdx >= 0 ? cleanCell(cells[usernameIdx]) : null,
          password: passwordIdx >= 0 ? cleanCell(cells[passwordIdx]) : null,
        };
      });

    if (!credentials?.username || !credentials?.password) {
      throw new Error('Kullanıcı bilgileri alınamadı');
    }

    return {
      username: credentials.username,
      password: credentials.password,
    };
  } finally {
    if (browser) await browser.close();
  }
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
      const generatedOtp   = generateOtp();
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
      const creds = await createTrialUser();
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
