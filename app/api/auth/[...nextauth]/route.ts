// app/api/auth/[...nextauth]/route.ts
// DÜZELTME: Bu dosyanın yolu kesinlikle app/api/auth/[...nextauth]/route.ts olmalıdır.
// pages/ klasörü kullananlar için: pages/api/auth/[...nextauth].ts (farklı export)

import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { createTransport } from 'nodemailer';

// ─── Upstash Redis helpers (native fetch) ────────────────────────────────────
const R_URL   = process.env.UPSTASH_REDIS_REST_URL!;
const R_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

async function rGet<T>(key: string): Promise<T | null> {
  const res  = await fetch(`${R_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${R_TOKEN}` },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.result) return null;
  try {
    return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
  } catch {
    return json.result as T;
  }
}

async function rSet(key: string, value: unknown, ex?: number) {
  const url = ex
    ? `${R_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}?EX=${ex}`
    : `${R_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`;
  await fetch(url, {
    headers: { Authorization: `Bearer ${R_TOKEN}` },
    cache: 'no-store',
  });
}

// ─── Minimal Redis adapter (NextAuth için) ────────────────────────────────────
function RedisAdapter() {
  return {
    async createUser(user: { email: string; name?: string; image?: string }) {
      const id = `user:${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const existing = await rGet<{ email: string; id: string }>(id);
      if (existing) return { ...existing };
      const newUser = {
        id,
        email: user.email,
        name:  user.name  ?? '',
        image: user.image ?? '',
        createdAt: Date.now(),
      };
      await rSet(id, newUser);
      return newUser;
    },
    async getUser(id: string) {
      return await rGet(id);
    },
    async getUserByEmail(email: string) {
      const id = `user:${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      return await rGet(id);
    },
    async getUserByAccount({ providerAccountId }: { providerAccountId: string }) {
      const linkKey = `account:${providerAccountId}`;
      const userId  = await rGet<string>(linkKey);
      if (!userId) return null;
      return await rGet(userId);
    },
    async updateUser(user: { id: string; [k: string]: unknown }) {
      const existing = await rGet<Record<string, unknown>>(user.id);
      const updated  = { ...(existing ?? {}), ...user };
      await rSet(user.id, updated);
      return updated;
    },
    async linkAccount(account: { userId: string; providerAccountId: string }) {
      await rSet(`account:${account.providerAccountId}`, account.userId);
    },
    async createSession(session: { sessionToken: string; userId: string; expires: Date }) {
      await rSet(`session:${session.sessionToken}`, session, 30 * 24 * 3600);
      return session;
    },
    async getSessionAndUser(sessionToken: string) {
      const session = await rGet<{ userId: string; expires: Date }>(`session:${sessionToken}`);
      if (!session) return null;
      const user = await rGet(session.userId);
      if (!user) return null;
      return { session, user };
    },
    async updateSession(session: { sessionToken: string; [k: string]: unknown }) {
      const existing = await rGet<Record<string, unknown>>(`session:${session.sessionToken}`);
      const updated  = { ...(existing ?? {}), ...session };
      await rSet(`session:${session.sessionToken}`, updated, 30 * 24 * 3600);
      return updated;
    },
    async deleteSession(sessionToken: string) {
      await fetch(`${R_URL}/del/${encodeURIComponent(`session:${sessionToken}`)}`, {
        headers: { Authorization: `Bearer ${R_TOKEN}` },
      });
    },
    async createVerificationToken(token: { identifier: string; token: string; expires: Date }) {
      await rSet(`vtoken:${token.identifier}:${token.token}`, token, 600); // 10 dakika
      return token;
    },
    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      const key    = `vtoken:${identifier}:${token}`;
      const stored = await rGet(key);
      if (!stored) return null;
      await fetch(`${R_URL}/del/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${R_TOKEN}` },
      });
      return stored as { identifier: string; token: string; expires: Date };
    },
  };
}

// ─── Özel e-posta şablonu ─────────────────────────────────────────────────────
async function sendVerificationRequest(params: {
  identifier: string;
  url: string;
  // diğer NextAuth parametreleri
  [k: string]: unknown;
}) {
  const { identifier: email, url } = params;

  const transport = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transport.sendMail({
    to:      email,
    from:    `GalyaStream <${process.env.EMAIL_USER}>`,
    subject: 'GalyaStream – Giriş Bağlantınız',
    html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060d18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060d18;padding:40px 16px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

          <!-- Logo / Marka -->
          <tr>
            <td align="center" style="padding-bottom:28px">
              <span style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">
                Galya<span style="color:#3b82f6">Stream</span>
              </span>
            </td>
          </tr>

          <!-- Ana kart -->
          <tr>
            <td style="background:#0a1525;border:1px solid #1e2d42;border-radius:20px;overflow:hidden">

              <!-- Üst renkli şerit -->
              <tr>
                <td style="height:4px;background:linear-gradient(90deg,#3b82f6,#6366f1)"></td>
              </tr>

              <!-- İçerik -->
              <tr>
                <td style="padding:36px 36px 32px">

                  <!-- İkon -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
                    <tr>
                      <td style="background:#1e3a5f;border-radius:14px;width:52px;height:52px;text-align:center;vertical-align:middle">
                        <span style="font-size:24px;line-height:52px">🔐</span>
                      </td>
                    </tr>
                  </table>

                  <!-- Başlık -->
                  <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px">
                    Giriş Bağlantınız Hazır
                  </h1>
                  <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#6b7280">
                    Aşağıdaki butona tıklayarak GalyaStream hesabınıza güvenli şekilde giriş yapabilirsiniz.
                    Bu bağlantı <strong style="color:#8b9ab3">10 dakika</strong> geçerlidir.
                  </p>

                  <!-- Buton -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
                    <tr>
                      <td style="background:#3b82f6;border-radius:12px">
                        <a href="${url}"
                          style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.1px">
                          Giriş Yap &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Alternatif link -->
                  <p style="margin:0 0 4px;font-size:11px;color:#374151">
                    Buton çalışmıyorsa bu bağlantıyı tarayıcınıza yapıştırın:
                  </p>
                  <p style="margin:0;font-size:11px;word-break:break-all">
                    <a href="${url}" style="color:#3b82f6;text-decoration:none">${url}</a>
                  </p>

                </td>
              </tr>

              <!-- Uyarı bölümü -->
              <tr>
                <td style="background:#070f1c;border-top:1px solid #131f30;padding:16px 36px">
                  <p style="margin:0;font-size:12px;color:#374151;line-height:1.5">
                    ⚠️ Bu giriş talebini siz oluşturmadıysanız bu e-postayı görmezden gelebilirsiniz. Hesabınız güvendedir.
                  </p>
                </td>
              </tr>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px">
              <p style="margin:0 0 6px;font-size:12px;color:#1f2937">
                © 2025 GalyaStream — Donmayan IPTV
              </p>
              <p style="margin:0;font-size:11px;color:#111827">
                <a href="https://www.galyastream.com" style="color:#374151;text-decoration:none">galyastream.com</a>
                &nbsp;·&nbsp;
                <a href="https://wa.me/447441921660" style="color:#374151;text-decoration:none">Destek</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  // Geliştirme ortamında e-posta önizleme URL'si logla
  if (process.env.NODE_ENV !== 'production') {
    console.log('[NextAuth] Verification email sent to:', email);
    console.log('[NextAuth] Preview URL:', url);
  }

  return info;
}

// ─── NextAuth yapılandırması ──────────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: RedisAdapter() as any,

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      from: process.env.EMAIL_USER,
      // Özel şablon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sendVerificationRequest: sendVerificationRequest as any,
    }),
  ],

  pages: {
    signIn:  '/giris',
    newUser: '/profil',   // Yeni kullanıcılar buraya yönlendirilir
    error:   '/giris',
  },

  // JWT strategy: veritabanı session yerine cookie imzalı JWT kullanır.
  // Redis adapter ile de birlikte çalışır.
  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    },
    // DÜZELTME: redirect callback — callbackUrl'in aynı origin'den olduğundan emin ol.
    async redirect({ url, baseUrl }) {
      // Göreceli URL'lere izin ver
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Aynı origin'deki mutlak URL'lere izin ver
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  // Geliştirme ortamında detaylı hata mesajları
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

// App Router için doğru export biçimi
export { handler as GET, handler as POST };
