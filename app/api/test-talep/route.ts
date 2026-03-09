import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';
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
  let browser: puppeteer.Browser | null = null;
  let trialPage: puppeteer.Page | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    trialPage = await browser.newPage();
    await trialPage.goto(`${PANEL_URL}/dashboard`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const needsLogin = await trialPage.evaluate(() => {
      return !!document.querySelector('input[type="password"]');
    });

    if (needsLogin) {
      const userField =
        (await trialPage.$('input[name="username"]')) ||
        (await trialPage.$('#username')) ||
        (await trialPage.$('input[type="text"]'));

      const passField =
        (await trialPage.$('input[name="password"]')) ||
        (await trialPage.$('#password')) ||
        (await trialPage.$('input[type="password"]'));

      if (!userField || !passField) {
        throw new Error('Panel giriş alanları bulunamadı.');
      }

      await userField.click({ clickCount: 3 });
      await userField.type(PANEL_USER);

      await passField.click({ clickCount: 3 });
      await passField.type(PANEL_PASS);

      await trialPage.keyboard.press('Enter');
      await trialPage.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 20000,
      }).catch(() => {});
      await new Promise((r) => setTimeout(r, 2000));
    }

    await trialPage.goto(`${PANEL_URL}/lines/create/1/line`, {
      waitUntil: 'networkidle2',
      timeout: 25000,
    });

    await new Promise((r) => setTimeout(r, 1500));

    await trialPage.evaluate(() => {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      for (const cb of Array.from(checkboxes)) {
        const label =
          ((cb.closest('label') || cb.parentElement) as HTMLElement | null)?.innerText || '';
        if (/country.?lock/i.test(label) && (cb as HTMLInputElement).checked) {
          (cb as HTMLInputElement).click();
        }
      }
    });

    await new Promise((r) => setTimeout(r, 500));

    const pkgResult = await trialPage.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[];

      for (const sel of selects) {
        const opt = Array.from(sel.options).find((o) => /12 saat/i.test(o.text));
        if (opt) {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          return 'done';
        }
      }

      const select2Singles = document.querySelectorAll('.select2-selection--single');
      if (select2Singles.length) {
        (select2Singles[select2Singles.length - 1] as HTMLElement).click();
        return 'select2';
      }

      return 'notfound';
    });

    if (pkgResult === 'select2') {
      await new Promise((r) => setTimeout(r, 800));

      let found = await trialPage.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.select2-results__option'));
        const item = items.find((i) => /12 saat/i.test(i.textContent || ''));
        if (item) {
          (item as HTMLElement).click();
          return true;
        }
        return false;
      });

      if (!found) {
        await trialPage.keyboard.type('12');
        await new Promise((r) => setTimeout(r, 600));

        found = await trialPage.evaluate(() => {
          const items = Array.from(document.querySelectorAll('.select2-results__option'));
          const item = items.find((i) => /12 saat/i.test(i.textContent || ''));
          if (item) {
            (item as HTMLElement).click();
            return true;
          }
          return false;
        });
      }

      if (!found) {
        throw new Error('12 saat paketi seçilemedi.');
      }
    } else if (pkgResult === 'notfound') {
      throw new Error('Package dropdown bulunamadı.');
    }

    await new Promise((r) => setTimeout(r, 800));

    await trialPage.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll('button[type="submit"], input[type="submit"], button')
      ) as HTMLElement[];

      const btn = buttons.find((b) =>
        /save|kaydet/i.test(b.innerText || (b as HTMLInputElement).value || b.textContent || '')
      );

      if (!btn) throw new Error('Kaydet butonu bulunamadı.');
      btn.click();
    });

    await trialPage.waitForNavigation({
      waitUntil: 'networkidle2',
      timeout: 20000,
    }).catch(() => {});

    await new Promise((r) => setTimeout(r, 5000));

    await trialPage.goto(`${PANEL_URL}/lines`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise((r) => setTimeout(r, 2000));

    const credentials = await trialPage.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      if (!rows.length) return null;

      const firstRow = rows[0];
      const cells = firstRow.querySelectorAll('td');
      const headers = Array.from(document.querySelectorAll('table thead th'));

      let usernameIdx = -1;
      let passwordIdx = -1;

      headers.forEach((th, i) => {
        const t = (th.textContent || '').toLowerCase();
        if (t.includes('username')) usernameIdx = i;
        if (t.includes('password')) passwordIdx = i;
      });

      function cleanCell(cell: Element | null) {
        if (!cell) return null;
        for (const node of Array.from(cell.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE) {
            const t = node.textContent?.trim();
            if (t) return t;
          }
        }
        return (cell.textContent || '')
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
      throw new Error('Gerçek test bilgileri panelden alınamadı.');
    }

    return credentials;
  } finally {
    if (trialPage) {
      await trialPage.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
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
