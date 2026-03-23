'use client';

import Link from 'next/link';
import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';

interface Subscription {
  plan: string;
  durationDays: number;
  username: string;
  password: string;
  remainingDays: number;
  expiresFormatted: string;
}

const DEFAULT_SERVER_URL = 'http://pro4kiptv.xyz:2086';

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        if (!value) return;
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
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }

    setSubscriptionLoading(true);
    fetch(`/api/subscription?email=${encodeURIComponent(session.user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setSubscription(null);
          return;
        }

        setSubscription(data.subscription);
        setServerUrl(DEFAULT_SERVER_URL);
        setUsername(data.subscription.username || '');
        setPassword(data.subscription.password || '');
      })
      .catch(() => setSubscription(null))
      .finally(() => setSubscriptionLoading(false));
  }, [session?.user?.email, status]);

  const m3uLink = useMemo(() => {
    if (!serverUrl || !username || !password) return '';
    const cleanServer = serverUrl.replace(/\/$/, '');
    return `${cleanServer}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u&output=ts`;
  }, [password, serverUrl, username]);

  return (
    <div className="min-h-screen bg-[#07111f] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#8b9ab3] transition-colors hover:text-white">
            ← Ana sayfaya dön
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/kurulum-rehberi" className="inline-flex items-center gap-2 rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-2 text-sm font-semibold text-[#9ca3af] transition-all hover:border-[#3b82f6]/40 hover:text-white">
              Kurulum Rehberi
            </Link>
            <Link href="/profil" className="inline-flex items-center gap-2 rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-2 text-sm font-semibold text-[#9ca3af] transition-all hover:border-[#3b82f6]/40 hover:text-white">
              Profilim
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#1e2d42] bg-[#0a1525] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#3b82f6]">Xtream API Girişi</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Mail değil, direkt Xtream bilgileriyle giriş</h1>
            <p className="mt-3 text-sm leading-6 text-[#8b9ab3] sm:text-base">
              Bu ekranda sunucu URL, kullanıcı adı ve şifreyi doğrudan girip kopyalayabilirsin. Eğer hesabınla giriş yaptıysan ve aktif aboneliğin varsa alanlar otomatik doldurulur.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-[#1e2d42] bg-[#07111f] p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">Giriş Bilgileri</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Xtream API Formu</h2>
                </div>
                {subscription ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-300">Aktif Abonelik</p>
                    <p className="mt-1 text-sm font-bold text-white">{subscription.plan}</p>
                    <p className="mt-1 text-xs text-[#8b9ab3]">{subscription.remainingDays} gün · {subscription.expiresFormatted}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#6b7280]">Durum</p>
                    <p className="mt-1 text-sm font-bold text-white">Manuel giriş</p>
                    <p className="mt-1 text-xs text-[#8b9ab3]">Bilgileri kendin girebilirsin</p>
                  </div>
                )}
              </div>

              {subscriptionLoading && (
                <div className="mb-4 rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] px-4 py-3 text-sm text-[#8b9ab3]">
                  Abonelik bilgileri kontrol ediliyor, varsa alanlar otomatik doldurulacak...
                </div>
              )}

              <div className="space-y-4">
                {[
                  {
                    label: 'Sunucu URL',
                    value: serverUrl,
                    setValue: setServerUrl,
                    placeholder: 'http://pro4kiptv.xyz:2086',
                  },
                  {
                    label: 'Kullanıcı Adı',
                    value: username,
                    setValue: setUsername,
                    placeholder: 'kullanici_adi',
                  },
                  {
                    label: 'Şifre',
                    value: password,
                    setValue: setPassword,
                    placeholder: 'sifre',
                  },
                ].map((field) => (
                  <div key={field.label} className="rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">{field.label}</label>
                      <CopyBtn value={field.value} />
                    </div>
                    <input
                      value={field.value}
                      onChange={(event) => field.setValue(event.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-[#1e2d42] bg-[#07111f] px-4 py-3 font-mono text-sm text-white outline-none transition-all focus:border-[#3b82f6]/50"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">M3U Linki</p>
                  <CopyBtn value={m3uLink} />
                </div>
                <p className="break-all font-mono text-xs leading-6 text-[#8b9ab3]">
                  {m3uLink || 'Sunucu URL, kullanıcı adı ve şifreyi girince M3U linki burada oluşur.'}
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-[#1e2d42] bg-[#07111f] p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#818cf8]">Hızlı Açılış</p>
                <h2 className="mt-1 text-xl font-bold text-white">Uygulama seç ve giriş yap</h2>
                <p className="mt-2 text-sm text-[#8b9ab3]">
                  Aşağıdaki ekranlar Xtream Codes giriş adımlarını gösterir. Bu sayfadaki sunucu URL, kullanıcı adı ve şifreyi doğrudan ilgili uygulamaya yazabilirsin.
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

              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-100">
                <p className="font-bold">Nasıl kullanılır?</p>
                <ol className="mt-2 list-decimal space-y-2 pl-4 text-[#cfe8ff]">
                  <li>Sunucu URL, kullanıcı adı ve şifre alanlarını doldur.</li>
                  <li>İstersen her alanı tek tek veya M3U linkini kopyala.</li>
                  <li>Sağdaki uygun uygulama rehberini açıp bilgileri uygulamaya gir.</li>
                </ol>
              </div>
            </div>
          </div>
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
