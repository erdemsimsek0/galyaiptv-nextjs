'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function KayitPage() {
  const [form, setForm] = useState({ ad: '', soyad: '', email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const isValid = form.ad.trim() && form.soyad.trim() && form.email.includes('@') && form.password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) { setError('Tüm alanları eksiksiz doldurun.'); return; }
    setLoading(true); setError('');
    try {
      // TODO: gerçek auth API entegrasyonu
      // const res = await fetch('/api/auth/register', { method: 'POST', ... });
      await new Promise(r => setTimeout(r, 900));
      window.location.href = '/';
    } catch {
      setError('Kayıt oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center p-4">
      {/* Arka plan glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1e3a5f]/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Galya IPTV"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const fb = e.currentTarget.nextElementSibling as HTMLElement;
                if (fb) fb.style.display = 'block';
              }}
            />
            <span className="hidden text-xl font-bold text-white">
              Galya <span className="text-[#3b82f6]">IPTV</span>
            </span>
          </Link>
        </div>

        {/* Kart */}
        <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525]/80 p-8 backdrop-blur-sm shadow-2xl">
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-black text-white">Hesap Oluştur</h1>
            <p className="mt-1.5 text-sm text-[#6b7280]">Yeni bir Galya IPTV hesabı oluşturun</p>
          </div>

          {/* Google butonu */}
          <button
            type="button"
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-[#1e2d42] bg-white px-4 py-3 text-sm font-semibold text-[#111] transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile Devam Et
          </button>

          {/* Ayırıcı */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1e2d42]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#374151]">Veya</span>
            <div className="flex-1 h-px bg-[#1e2d42]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ad / Soyad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#8b9ab3]">Ad</label>
                <input
                  type="text"
                  placeholder="Adınız"
                  value={form.ad}
                  onChange={set('ad')}
                  autoComplete="given-name"
                  className="w-full rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-3 py-3 text-sm text-white placeholder:text-[#374151] outline-none transition-all focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#8b9ab3]">Soyad</label>
                <input
                  type="text"
                  placeholder="Soyadınız"
                  value={form.soyad}
                  onChange={set('soyad')}
                  autoComplete="family-name"
                  className="w-full rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-3 py-3 text-sm text-white placeholder:text-[#374151] outline-none transition-all focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/20"
                />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#8b9ab3]">E-posta</label>
              <input
                type="email"
                placeholder="ornek@email.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                className="w-full rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-3 text-sm text-white placeholder:text-[#374151] outline-none transition-all focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/20"
              />
            </div>

            {/* Şifre */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#8b9ab3]">Şifre</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="En az 8 karakter"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-3 pr-10 text-sm text-white placeholder:text-[#374151] outline-none transition-all focus:border-[#3b82f6]/50 focus:ring-1 focus:ring-[#3b82f6]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4b5563] transition-colors hover:text-[#8b9ab3]"
                >
                  {showPass ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18C2.14 5.613 5.745 3 10 3s7.86 2.613 9.336 6.41c.147.381.147.8 0 1.18C17.861 14.387 14.256 17 10 17S2.14 14.387.664 10.59zM10 14a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.18C17.86 5.613 14.256 3 10 3a9.958 9.958 0 00-4.512 1.074L3.28 2.22zm4.261 4.26l1.514 1.515a2.5 2.5 0 013.15 3.15l1.514 1.514a4 4 0 00-6.178-6.179z" clipRule="evenodd"/>
                      <path d="M7.584 9.659a.75.75 0 00-.75-.75h-.008a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008z"/>
                    </svg>
                  )}
                </button>
              </div>
              {/* Şifre güç göstergesi */}
              {form.password.length > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      form.password.length >= (i + 1) * 2
                        ? i < 1 ? 'bg-red-500' : i < 2 ? 'bg-amber-500' : i < 3 ? 'bg-blue-500' : 'bg-emerald-500'
                        : 'bg-[#1e2d42]'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            {/* Doğrulandı badge */}
            {isValid && (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                </svg>
                Doğrulandı
              </div>
            )}

            {/* Hata */}
            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-950/30 px-3 py-2 text-xs text-red-400">{error}</p>
            )}

            {/* Kayıt butonu */}
            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-[#111] transition-all hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Oluşturuluyor...
                </>
              ) : (
                <>Hesap Oluştur →</>
              )}
            </button>
          </form>

          {/* Giriş yap bağlantısı */}
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
        </div>

        {/* Alt link */}
        <p className="mt-5 text-center text-xs text-[#374151]">
          <Link href="/" className="transition-colors hover:text-[#8b9ab3]">← Ana sayfaya dön</Link>
        </p>
      </div>
    </div>
  );
}
