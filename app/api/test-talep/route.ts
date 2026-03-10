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

  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 900 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless as any,
    });

    const trialPage = await browser.newPage();

    // 1. Giriş İşlemi
    await trialPage.goto(`${PANEL_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 60000 });

    const needsLogin = await trialPage.evaluate(() => !!document.querySelector('input[type="password"]'));
    if (needsLogin) {
      await trialPage.type('input[name="username"], #username', PANEL_USER);
      await trialPage.type('input[name="password"], #password', PANEL_PASS);
      await Promise.all([
        trialPage.click('button[type="submit"], .btn-primary'),
        trialPage.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
    }

    // 2. Paket Oluşturma Sayfasına Git
    await trialPage.goto(`${PANEL_URL}/lines/create/1/line`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    // 3. Sayfadaki select elementlerini debug için logla
    const selectInfo = await trialPage.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[];
      return selects.map(s => ({
        id: s.id,
        name: s.name,
        className: s.className,
        optionCount: s.options.length,
        options: Array.from(s.options).slice(0, 10).map(o => ({ value: o.value, text: o.text })),
      }));
    });
    console.log('SELECT ELEMENTS:', JSON.stringify(selectInfo, null, 2));

    // 4. YÖNTEM 1: Native setter + jQuery + Select2 ile doğrudan değer ata
    const method1 = await trialPage.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[];
      for (const sel of selects) {
        const opt = Array.from(sel.options).find(
          o => o.value && /12 SAAT|24 SAAT|TEST/i.test(o.text)
        );
        if (!opt) continue;

        // Native setter (React/framework-aware)
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
        setter ? setter.call(sel, opt.value) : (sel.value = opt.value);

        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));

        const $ = (window as any).$;
        if ($) {
          $(sel).val(opt.value).trigger('change');
          if ($(sel).data('select2')) {
            $(sel).trigger('select2:select');
          }
        }
        return { ok: true, text: opt.text, value: opt.value };
      }
      return { ok: false };
    });

    console.log('METHOD1:', JSON.stringify(method1));

    if (!method1.ok) {
      // 5. YÖNTEM 2: Her Select2 container'a tek tek tıkla, dropdown açılana kadar dene
      const containers = await trialPage.$$('.select2-container, .select2-selection--single, .select2-selection');
      console.log(`Found ${containers.length} Select2 containers`);

      let dropdownOpened = false;

      for (let i = containers.length - 1; i >= 0; i--) {
        try {
          await containers[i].click();
          await new Promise(r => setTimeout(r, 1500));

          dropdownOpened = await trialPage.evaluate(() => {
            const dd = document.querySelector('.select2-dropdown');
            return !!(dd && (dd as HTMLElement).offsetHeight > 0);
          });

          if (dropdownOpened) {
            console.log(`Dropdown opened at container index ${i}`);
            break;
          }
        } catch (_) {}
      }

      if (!dropdownOpened) {
        // 6. YÖNTEM 3: Select2 search input'una doğrudan yaz
        try {
          await trialPage.click('.select2-search__field');
          await new Promise(r => setTimeout(r, 500));
        } catch (_) {}
      }

      // Şu an açık dropdown'daki seçenekleri tıkla
      const clicked = await trialPage.evaluate(() => {
        const items = Array.from(document.querySelectorAll(
          '.select2-results__option, [role="option"], .select2-dropdown li'
        ));
        const target = items.find((el: any) => /12 SAAT|24 SAAT|TEST/i.test(el.textContent));
        if (target) {
          (target as HTMLElement).click();
          return (target as HTMLElement).textContent?.trim() ?? 'clicked';
        }
        return null;
      });

      console.log('DROPDOWN CLICK:', clicked);

      if (!clicked) {
        // 7. YÖNTEM 4: Search input'a "TEST" yaz, sonuçtan seç
        try {
          const searchInput = await trialPage.$('.select2-search__field');
          if (searchInput) {
            await searchInput.type('TEST');
            await new Promise(r => setTimeout(r, 1500));
            const typed = await trialPage.evaluate(() => {
              const items = Array.from(document.querySelectorAll('.select2-results__option'));
              if (items[0]) { (items[0] as HTMLElement).click(); return items[0].textContent?.trim(); }
              return null;
            });
            console.log('SEARCH RESULT:', typed);
            if (!typed) throw new Error('Paket seçilemedi: dropdown seçenekleri boş.');
          } else {
            throw new Error('Paket seçilemedi: select2 search input bulunamadı.');
          }
        } catch (e: any) {
          throw new Error(`Paket seçilemedi: ${e.message}`);
        }
      }
    }

    // 8. Paket seçimi sonrası yükleme için bekle
    await new Promise(r => setTimeout(r, 5000));

    // 9. Save butonuna tıkla
    await Promise.all([
      trialPage.evaluate(() => {
        const btns = Array.from(
          document.querySelectorAll('button, input[type="submit"], a.btn')
        ) as HTMLElement[];
        const save = btns.find(b =>
          /save|kaydet|create/i.test(b.innerText || (b as HTMLInputElement).value || '')
          || b.classList.contains('btn-success')
          || b.classList.contains('btn-primary')
        );
        if (save) save.click();
      }),
      trialPage.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
    ]);

    await new Promise(r => setTimeout(r, 2000));

    // 10. Lines sayfasından credentials al
    await trialPage.goto(`${PANEL_URL}/lines`, { waitUntil: 'networkidle2' });
    await trialPage.waitForSelector('table tbody tr', { timeout: 15000 });

    const credentials = await trialPage.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      if (!rows.length) return null;
      const cells = Array.from(rows[0].querySelectorAll('td'));
      const username = (cells[1]?.textContent?.trim() || '').split(/\s+/)[0];
      const password = cells[2]?.textContent?.trim() || '';
      return { username, password };
    });

    if (!credentials?.username || credentials.username.length < 3) {
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
      await sendTrialMail(email, creds.username!, creds.password!);

      return NextResponse.json({ success: true, ...creds });
    }

    return NextResponse.json({ success: false, error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Hata oluştu.' },
      { status: 500 }
    );
  }
}
