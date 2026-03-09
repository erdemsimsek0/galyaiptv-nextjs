import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import OpenAI from 'openai';
import { getIPTVInfo } from '@/lib/scraper';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const otpStore = new Map(); // Bellekte geçici OTP tutma

export async function POST(req) {
  const { action, email, otp } = await req.json();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  // AŞAMA 1: KOD GÖNDERME
  if (action === 'send_otp') {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { code, expires: Date.now() + 300000 }); // 5 dk süre

    await transporter.sendMail({
      from: '"Galya IPTV" <noreply@galyaiptv.com.tr>',
      to: email,
      subject: 'Doğrulama Kodunuz: ' + code,
      text: `Test açmak için doğrulama kodunuz: ${code}`
    });
    return NextResponse.json({ success: true });
  }

  // AŞAMA 2: DOĞRULAMA VE TEST AÇMA
  if (action === 'verify') {
    const data = otpStore.get(email);
    if (!data || data.code !== otp) return NextResponse.json({ error: 'Kod hatalı!' });

    // Panelden testi aç
    const testBilgileri = await getIPTVInfo();

    // OpenAI ile E-posta Metnini Güzelleştir
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "Sen profesyonel bir IPTV satış temsilcisisin. Müşteriye test bilgilerini içeren, nazik ve heyecan verici bir e-posta yaz."
      }, {
        role: "user",
        content: `Bilgiler şunlar: ${JSON.stringify(testBilgileri)}. Lütfen bu bilgileri kullanarak bir mail metni yaz.`
      }]
    });

    // Kullanıcıya Mail At
    await transporter.sendMail({
      from: '"Galya IPTV" <info@galyaiptv.com.tr>',
      to: email,
      subject: 'Ücretsiz IPTV Test Hesabınız Tanımlandı!',
      text: aiResponse.choices[0].message.content
    });

    otpStore.delete(email);
    return NextResponse.json({ success: true });
  }
}
