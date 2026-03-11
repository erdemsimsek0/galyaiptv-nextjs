// v2 - railway
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

type OtpRecord = {
  email: string;
  otp: string;
  expiresAt: number;
};

const otpStore = new Map<string, OtpRecord>();

const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;
const TRIAL_SERVICE_URL = process.env.TRIAL_SERVICE_URL!;
const TRIAL_API_SECRET = process.env.TRIAL_API_SECRET!;

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
  const whatsappUrl = `https://wa.me/447441921660?text=Merhaba%2C%20test%20hesab%C4%B1m%C4%B1%20kulland%C4%B1m%20ve%20sat%C4%B1n%20almak%20istiyorum.`;

  await transporter.sendMail({
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
            <tr>
              <td style="width:35%;color:#888;padding:8px 0;"><strong>Sunucu:</strong></td>
              <td style="font-family:monospace;color:#333;font-size:13px;">http://pro4kiptv.xyz:2086/</td>
            </tr>
            <tr style="background-color:#f9f5ff;">
              <td style="color:#888;padding:8px;border-radius:4px 0 0 4px;"><strong>Kullanıcı Adı:</strong></td>
              <td style="font-family:monospace;color:#512da8;font-size:14px;font-weight:bold;padding:8px;background:#f0ebff;border-radius:0 4px 4px 0;">${username}</td>
            </tr>
            <tr>
              <td style="color:#888;padding:8px 0;"><strong>Şifre:</strong></td>
              <td style="font-family:monospace;color:#512da8;font-size:14px;font-weight:bold;padding:8px;background:#f0ebff;border-radius:4px;">${password}</td>
            </tr>
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

async function createTrialUser() {
  const res = await fetch(`${TRIAL_SERVICE_URL}/create-trial`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': TRIAL_API_SECRET,
    },
    body: JSON.stringify({}),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || 'Trial servisi hata döndürdü.');
  }

  return { username: data.username, password: data.password };
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

      return NextResponse.json({ success: true, token: generatedToken });
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
      { success: false, error: error?.message || 'Sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
