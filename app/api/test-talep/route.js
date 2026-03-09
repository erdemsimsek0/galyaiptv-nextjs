import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';
import { getIPTVInfo } from '@/lib/scraper';

// OTP'yi basit bir token içine göm
function encodeToken(email, code) {
  const data = `${email}:${code}:${Date.now()}`;
  return Buffer.from(data).toString('base64');
}

function decodeToken(token) {
  try {
    const data = Buffer.from(token, 'base64').toString('utf8');
    const [email, code, timestamp] = data.split(':');
    return { email, code, timestamp: Number(timestamp) };
  } catch {
    return null;
  }
}

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req) {
  const { action, email, otp, token } = await req.json();

  if (action === 'send_otp') {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const newToken = encodeToken(email, code);

    await getTransporter().sendMail({
      from: '"Galya IPTV" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Doğrulama Kodunuz: ' + code,
      text: `Test açmak için doğrulama kodunuz: ${code}`
    });

    // Token'ı client'a gönder (bellekte saklamaya gerek yok)
    return NextResponse.json({ success: true, token: newToken });
  }

  if (action === 'verify') {
    if (!token) return NextResponse.json({ error: 'Token eksik!' });
    
    const decoded = decodeToken(token);
    if (!decoded) return NextResponse.json({ error: 'Geçersiz token!' });
    
    // 5 dakika kontrolü
    if (Date.now() - decoded.timestamp > 300000) {
      return NextResponse.json({ error: 'Kodun süresi dolmuş, yeni kod isteyin.' });
    }
    
    if (decoded.email !== email || decoded.code !== otp) {
      return NextResponse.json({ error: 'Kod hatalı!' });
    }

    const testBilgileri = await getIPTVInfo();

    let mailMetni = `IPTV Test Bilgileriniz:\n\nURL: ${testBilgileri.url}\nKullanıcı Adı: ${testBilgileri.username}\nŞifre: ${testBilgileri.password}\n\nTest süreniz 24 saattir.`;

    try {
      const aiResponse = await getOpenAI().chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: "Sen profesyonel bir IPTV satış temsilcisisin. Müşteriye test bilgilerini içeren, nazik ve heyecan verici bir e-posta yaz."
        }, {
          role: "user",
          content: `Bilgiler şunlar: ${JSON.stringify(testBilgileri)}. Lütfen bu bilgileri kullanarak bir mail metni yaz.`
        }]
      });
      mailMetni = aiResponse.choices[0].message.content;
    } catch (e) {
      // OpenAI hata verirse düz metin gönder
    }

    await getTransporter().sendMail({
      from: '"Galya IPTV" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Ücretsiz IPTV Test Hesabınız Tanımlandı!',
      text: mailMetni
    });

    return NextResponse.json({ success: true });
  }
}
