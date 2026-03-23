'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Subscription {
  plan: string;
  durationDays: number;
  username: string;
  password: string;
  remainingDays: number;
  expiresFormatted: string;
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${copied ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-[#1e2d42] bg-[#0d1a2a] text-[#9ca3af] hover:border-[#3b82f6]/40 hover:text-white'}`}
    >
      {copied ? 'Kopyalandı' : 'Kopyala'}
    </button>
  );
}

function XtreamGirisInner() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/giris');
      return;
    }

    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }

    fetch(`/api/subscription?email=${encodeURIComponent(session.user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubscription(data.subscription);
        } else {
          setSubscription(null);
        }
      })
      .catch(() => setSubscription(null))
      .finally(() => setLoading(false));
  }, [router, session?.user?.email, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#1e2d42] border-t-[#3b82f6]" />
          <p className="text-sm text-[#8b9ab3]">Xtream giriş bilgileri hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8b9ab3] transition-colors hover:text-white">
            ← Ana sayfaya dön
          </Link>
          <Link href="/profil" className="inline-flex items-center gap-2 rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-2 text-sm font-semibold text-[#9ca3af] transition-all hover:border-[#3b82f6]/40 hover:text-white">
            Profilim
          </Link>
        </div>

        <div className="rounded-[28px] border border-[#1e2d42] bg-[#0a1525] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#3b82f6]">Xtream API Girişi</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Testten bağımsız direkt giriş ekranı</h1>
            <p className="mt-3 text-sm leading-6 text-[#8b9ab3] sm:text-base">
              Bu sayfa aktif aboneliğinize ait Xtream API bilgilerini tek yerde toplar. Sunucu URL, kullanıcı adı ve şifreyi kopyalayıp doğrudan uygulamaya giriş yapabilirsiniz.
            </p>
          </div>

          {subscription ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">Aktif Abonelik</p>
                    <h2 className="mt-1 text-xl font-bold text-white">{subscription.plan}</h2>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-[#07111f] px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#6b7280]">Kalan Süre</p>
                    <p className="mt-1 text-xl font-black text-white">{subscription.remainingDays} gün</p>
                    <p className="mt-1 text-xs text-[#8b9ab3]">Bitiş: {subscription.expiresFormatted}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Server URL', value: 'http://pro4kiptv.xyz:2086' },
                    { label: 'Kullanıcı Adı', value: subscription.username },
                    { label: 'Şifre', value: subscription.password },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-3 rounded-2xl border border-[#1e2d42] bg-[#07111f] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">{item.label}</p>
                        <p className="mt-1 truncate font-mono text-sm font-semibold text-white sm:text-base">{item.value}</p>
                      </div>
                      <CopyBtn value={item.value} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-[#1e2d42] bg-[#07111f] p-5 sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#818cf8]">Hızlı Açılış</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Uygulama seç ve direkt kuruluma geç</h2>
                  <p className="mt-2 text-sm text-[#8b9ab3]">
                    Aşağıdaki kısayollar seni doğru Xtream kurulum ekranına götürür. Bilgiler bu sayfada sabit kaldığı için test akışına girmene gerek yok.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { href: '/kurulum-rehberi?platform=android&app=xpiptv', label: '📱 Telefon / Tablet', sub: 'XP IPTV ile Xtream Codes girişi' },
                    { href: '/kurulum-rehberi?platform=android&app=9xtream', label: '📦 TV Box', sub: '9Xtream ekranı hazır açılsın' },
                    { href: '/kurulum-rehberi?platform=windows&app=smarters-pc', label: '💻 Windows / macOS', sub: 'Smarters Player Pro kurulumu' },
                    { href: '/kurulum-rehberi?platform=smarttv&app=hotiptv', label: '🖥️ Smart TV', sub: 'Hot IPTV Player ile devam et' },
                  ].map((item) => (
                    <Link key={item.href} href={item.href} className="flex items-center justify-between gap-3 rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-3 transition-all hover:border-[#3b82f6]/40 hover:bg-[#132033]">
                      <div>
                        <p className="text-sm font-bold text-white">{item.label}</p>
                        <p className="text-xs text-[#8b9ab3]">{item.sub}</p>
                      </div>
                      <span className="text-[#6b7280]">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-amber-500/25 bg-amber-500/10 p-6 text-center">
              <p className="text-lg font-bold text-white">Aktif abonelik bulunamadı</p>
              <p className="mt-2 text-sm text-[#8b9ab3]">
                Bu ekran yalnızca aktif aboneliği olan kullanıcılar için Xtream API giriş bilgilerini gösterir.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/abonelik" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-amber-600">
                  👑 Abonelik Al
                </Link>
                <Link href="/kurulum-rehberi" className="rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-5 py-3 text-sm font-bold text-[#9ca3af] transition-all hover:border-[#3b82f6]/40 hover:text-white">
                  Kurulum Rehberi
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function XtreamGirisPage() {
  return (
    <SessionProvider>
      <XtreamGirisInner />
    </SessionProvider>
  );
}
