'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function KayitPage() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Geçerli bir e-posta girin.'); return; }
    setLoading(true);
    setError('');
    try {
      // redirect: false ile magic link gönderilir;
      // kullanıcı linke tıklayınca NextAuth otomatik /profil'e yönlendirir (callbackUrl).
      const res = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/profil',
      });
      if (res?.error) {
        setError('E-posta gönderilemedi. Lütfen tekrar deneyin.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setLoading(true);
    signIn('google', { callbackUrl: '/profil' });
  };

  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center p-3 sm:p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1e3a5f]/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <LogoWithFallback />
          </Link>
        </div>

        <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525]/80 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-950/50 text-3xl">✉️</div>
              <h2 className="text-xl font-bold text-white">E-postanızı Kontrol Edin</h2>
              <p className="text-sm text-[#8b9ab3]">
                <span className="font-semibold text-white">{email}</span> adresine giriş bağlantısı gönderdik.
                Bağlantıya tıklayarak hesabınıza erişebilirsiniz.
              </p>
              <div className="rounded-xl border border-[#3b82f6]/20 bg-[#3b82f6]/5 p-3 text-xs text-[#8b9ab3]">
                Bağlantı 10 dakika geçerlidir. Tıkladıktan sonra otomatik olarak yönlendirilirsiniz.
              </div>
              <p className="text-xs text-[#4b5563]">Spam klasörünü de kontrol edin.</p>
              <button
                onClick={() => { setSent(false); setError(''); }}
                className="text-xs text-[#3b82f6] hover:underline"
              >
                Farklı e-posta dene
              </button>
            </div>
          ) : (
            <>
              <div className="mb-7 text-center">
                <h1 className="text-xl font-black text-white sm:text-2xl">Hesap Oluştur</h1>
                <p className="mt-1.5 text-sm text-[#6b7280]">Yeni bir Galya IPTV hesabı oluşturun</p>
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-[#1e2d42] bg-white px-4 py-3 text-sm font-semibold text-[#111] transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google ile Devam Et
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-[#1e2d42]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#374151]">Veya</span>
                <div className="flex-1 h-px bg-[#1e2d42]" />
              </div>

              <form onSubmit={handleEmail} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#8b9ab3]">E-posta Adresi</label>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-3 text-sm text-white placeholder:text-[#374151] outline-none transition-all focus:border-[#3b82f6]/50"
                  />
                  <p className="mt-1 text-[11px] text-[#4b5563]">Giriş bağlantısı bu adrese gönderilecek.</p>
                </div>

                {email.includes('@') && email.includes('.') && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                    </svg>
                    Geçerli e-posta
                  </div>
                )}

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.includes('@')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-[#111] transition-all hover:bg-gray-100 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Gönderiliyor...
                    </>
                  ) : 'Doğrulama Bağlantısı Gönder →'}
                </button>
              </form>

              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-[#1e2d42]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#374151]">Zaten hesabınız var mı?</span>
                  <div className="flex-1 h-px bg-[#1e2d42]" />
                </div>
                <Link
                  href="/giris"
                  className="flex w-full items-center justify-center rounded-xl border border-[#1e2d42] bg-[#0d1a2a] py-3 text-sm font-semibold text-white transition-all hover:border-[#3b82f6]/30 hover:bg-[#162035]"
                >
                  Giriş Yap
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-[#374151]">
          <Link href="/" className="transition-colors hover:text-[#8b9ab3]">← Ana sayfaya dön</Link>
        </p>
      </div>
    </div>
  );
}

// ── Logo: resim yüklenebilirse göster, aksi hâlde metin fallback ──
function LogoWithFallback() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="text-xl font-black text-white">
        Galya <span className="text-[#3b82f6]">IPTV</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Galya IPTV"
      className="h-10 w-auto"
      onError={() => setFailed(true)}
    />
  );
}
