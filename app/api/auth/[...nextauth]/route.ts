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
    from:    `Galya IPTV <${process.env.EMAIL_USER}>`,
    subject: 'Galya IPTV – Giriş Bağlantınız',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#07111f;padding:32px;border-radius:16px">
        <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px">Galya IPTV</h1>
        <p style="color:#8b9ab3;font-size:14px;margin:0 0 24px">Aşağıdaki butona tıklayarak giriş yapabilirsiniz.</p>
        <a href="${url}" style="display:inline-block;background:#3b82f6;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none">
          Giriş Yap →
        </a>
        <p style="color:#374151;font-size:12px;margin:24px 0 0">
          Bu bağlantı 10 dakika geçerlidir. Siz talep etmediyseniz bu e-postayı yok sayabilirsiniz.
        </p>
      </div>
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
