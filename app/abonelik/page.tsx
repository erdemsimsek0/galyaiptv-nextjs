'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, SessionProvider } from 'next-auth/react';

const DEFAULT_PRICES: Record<string, number> = { max: 229.90, sports: 159.90, cinema: 129.90 };

function usePrices() {
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES);
  useEffect(() => {
    fetch('/api/prices')
      .then(r => r.json())
      .then(d => { if (d.success && d.prices) setPrices(d.prices); })
      .catch(() => {});
  }, []);
  return prices;
}

type DurKey = '3ay' | '6ay' | '12ay';
interface Dur { key: DurKey; label: string; months: number; discount: number; badge?: string; badgeCls?: string }

const DURATIONS: Dur[] = [
  { key: '12ay', label: '12 Ay', months: 12, discount: 20, badge: '%20 İNDİRİM', badgeCls: 'bg-emerald-600' },
  { key: '6ay',  label: '6 Ay',  months: 6,  discount: 5,  badge: '%5 İNDİRİM',  badgeCls: 'bg-blue-600' },
  { key: '3ay',  label: '3 Ay',  months: 3,  discount: 0 },
];

const DEVICES = [
  { n: 2 as const, label: '2 Cihaz', sub: 'Arkadaş', badge: '★ ÖNERİLEN', badgeCls: 'bg-amber-500', mul: 1.60 },
  { n: 1 as const, label: '1 Cihaz', sub: 'Bireysel', badge: null, mul: 1.0 },
  { n: 3 as const, label: '3 Cihaz', sub: 'Aile',    badge: null, mul: 2.20 },
];

interface Plan {
  id: string; lt: string; ltColor: string; name: string; desc: string;
  basePrice: number; popular: boolean; color: string; openCls: string; selCls: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'max', lt: 'MAX', ltColor: '#ef4444', name: 'Max', popular: true,
    color: '#ef4444', openCls: 'border-l-[#ef4444] border-[#ef444433]', selCls: 'border-[#ef444466] bg-[#0d0a0a]',
    desc: 'Tüm içeriklere sınırsız erişim — film, dizi, spor ve TV kanalları bir arada.',
    basePrice: 229.90,
    features: ['TV + Spor + Film + Dizi Tek Pakette', '15.000+ Güncel İçerik Arşivi', 'Yetişkin İçeriklere Dahil Erişim', 'HD / FHD / 4K Yüksek Kalite Yayın', 'Tüm Cihazlarda Kesintisiz İzleme', 'Hızlı Kanal Geçişi'],
  },
  {
    id: 'sports', lt: 'SPORTS', ltColor: '#22c55e', name: 'Sports', popular: false,
    color: '#22c55e', openCls: 'border-l-[#22c55e] border-[#22c55e33]', selCls: 'border-[#22c55e66] bg-[#071a0e]',
    desc: 'Tüm spor yayınları ve TV kanalları — maçlar, turnuvalar tek yerde.',
    basePrice: 159.90,
    features: ['Canlı Spor Kanalları ve Maçlar', 'Avrupa ve Yerel Spor Kanalları', 'HD / FHD / 4K Akıcı Yayın', 'Hızlı Kanal Geçişi ve Stabil İzleme', 'Smart TV ve Tüm Cihazlarla Uyumlu', 'Anlık Skor ve Maç Bildirimleri'],
  },
  {
    id: 'cinema', lt: 'CINEMA', ltColor: '#f59e0b', name: 'Cinema', popular: false,
    color: '#f59e0b', openCls: 'border-l-[#f59e0b] border-[#f59e0b33]', selCls: 'border-[#f59e0b66] bg-[#150e00]',
    desc: '15.000+ film ve dizi seçkisi — en popüler ve sevilen yapımlar bir arada.',
    basePrice: 129.90,
    features: ['15.000+ Film ve Dizi Arşivi', 'En Popüler Yeni Yapımlar', 'Altyazı ve Dublaj Seçenekleri', 'HD / FHD / 4K Sinema Kalitesi', 'Telefon, Tablet ve Smart TV', 'Kişisel İzleme Listesi'],
  },
];

function fmt(n: number) { const [i, d] = n.toFixed(2).split('.'); return `${i},${d}`; }
function calcTotal(base: number, months: number, disc: number, mul: number) {
  return Math.round(base * (1 - disc / 100) * months * mul * 100) / 100;
}

function PlanCard({ plan }: { plan: Plan }) {
  // Tüm kartlar kapalı başlar (popular olsa da)
  const [open, setOpen] = useState(false);
  // Varsayılan: 6 ay ve 2 cihaz
  const [selDur, setSelDur] = useState<DurKey>('6ay');
  const [selDev, setSelDev] = useState<1 | 2 | 3>(2);

  const dur  = DURATIONS.find(d => d.key === selDur)!;
  const dev  = DEVICES.find(d => d.n === selDev)!;
  const total = calcTotal(plan.basePrice, dur.months, dur.discount, dev.mul);
  const origTotal = Math.round(plan.basePrice * dur.months * dev.mul * 100) / 100;

  const odemeUrl = `/odeme?paket=${encodeURIComponent(plan.name)}&sure=${encodeURIComponent(dur.label)}&toplam=${total.toFixed(2)}&orijinal=${(plan.basePrice * dur.months).toFixed(2)}&indirim=${dur.discount}&cihaz=${selDev}`;

  return (
    <div
      className={`rounded-2xl overflow-hidden border transition-all duration-200 ${
        open
          ? `border-2 border-l-[3px] ${plan.openCls} bg-[#0a1320]`
          : 'border border-[#131f30] bg-[#0a1320]'
      }`}
    >
      {/* Header */}
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex h-11 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-[#1a2840] bg-[#0d1525]">
          <span className="text-xs font-black tracking-wide" style={{ color: plan.ltColor }}>{plan.lt}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-extrabold text-white">{plan.name}</span>
            {plan.popular && (
              <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black text-[#412402]">★ POPÜLER</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[#5a6a80]">{plan.desc}</p>
        </div>
        <div className="mr-2 flex-shrink-0 text-right">
          <p className="text-2xl font-black text-white">₺{fmt(plan.basePrice)}</p>
          <p className="text-[10px] text-[#4b5563]">/ay baz fiyat</p>
        </div>
        <svg
          viewBox="0 0 20 20" fill="currentColor"
          className={`h-5 w-5 flex-shrink-0 text-[#3a4a5c] transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-[#111e2e] px-5 pb-6 pt-5 space-y-5">
          {/* Features */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {plan.features.map(f => (
              <div key={f} className="flex items-start gap-2 text-xs text-[#7a8a9e]">
                <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2a3a4e]" />
                {f}
              </div>
            ))}
          </div>

          {/* Duration */}
          <div>
            <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-[#c0cfe0]">
              <svg className="h-3.5 w-3.5 text-[#3a5070]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              Abonelik Süresi
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map(d => {
                const t = calcTotal(plan.basePrice, d.months, d.discount, 1);
                const orig = Math.round(plan.basePrice * d.months * 100) / 100;
                const isSel = selDur === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => setSelDur(d.key)}
                    className={`relative rounded-[13px] border p-3 text-left transition-all ${isSel ? plan.selCls : 'border-[#131f30] bg-[#070f1c] hover:border-[#1e3a5f]'}`}
                  >
                    {d.badge && (
                      <span className={`absolute -top-2.5 left-2 rounded-full px-2 py-0.5 text-[9px] font-black text-white ${d.badgeCls}`}>
                        {d.badge}
                      </span>
                    )}
                    <p className={`text-xs font-bold text-white ${d.badge ? 'mt-2' : 'mt-0.5'}`}>{d.label}</p>
                    {d.discount > 0 && <p className="text-[10px] text-[#2a3a4e] line-through">₺{fmt(orig)}</p>}
                    <p className="text-base font-black text-white">₺{fmt(t)}</p>
                    <p className="text-[10px] text-[#4a5a70]">{d.months} ay toplam</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Devices */}
          <div>
            <div className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-[#c0cfe0]">
              <svg className="h-3.5 w-3.5 text-[#3a5070]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
              </svg>
              Eş Zamanlı İzleme
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEVICES.map(dv => {
                const isSel = selDev === dv.n;
                return (
                  <button
                    key={dv.n}
                    onClick={() => setSelDev(dv.n)}
                    className={`relative rounded-[13px] border p-3 text-left transition-all ${isSel ? plan.selCls : 'border-[#131f30] bg-[#070f1c] hover:border-[#1e3a5f]'}`}
                  >
                    {dv.badge && (
                      <span className={`absolute -top-2.5 left-2 rounded-full px-2 py-0.5 text-[9px] font-black text-white ${dv.badgeCls}`}>
                        {dv.badge}
                      </span>
                    )}
                    <p className={`text-xs font-bold text-white ${dv.badge ? 'mt-2' : 'mt-0.5'}`}>{dv.label}</p>
                    <p className="text-[10px] text-[#5a6a80]">{dv.sub}</p>
                    <p className="mt-0.5 text-[10px] text-[#3a4a5c]">{dv.mul === 1 ? 'Ek ücret yok' : `×${dv.mul} çarpan`}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-[#131f30] bg-[#070f1c] p-4">
            <div className="mb-3 flex items-start justify-between">
              <p className="text-xs text-[#5a6a80]">{plan.name} · {dur.label} · {selDev} Cihaz</p>
              <div className="text-right">
                {dur.discount > 0 && (
                  <p className="text-[11px] text-[#2a3a4e] line-through">₺{fmt(origTotal)}</p>
                )}
                <p className="text-2xl font-black text-white">₺{fmt(total)}</p>
              </div>
            </div>
            <Link
              href={odemeUrl}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: plan.color }}
            >
              Ödemeye Geç
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AbonelikHeader() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const name = session?.user?.name || session?.user?.email?.split('@')[0] || 'U';
  return (
    <div className="sticky top-0 z-50 border-b border-[#1e2d42] bg-[#060d18]/97 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="GalyaStream" className="h-8 w-auto" style={{ display: 'none' }}
            onLoad={e => { (e.currentTarget as HTMLImageElement).style.display = 'block'; const n = e.currentTarget.nextElementSibling as HTMLElement; if (n) n.style.display = 'none'; }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; const n = e.currentTarget.nextElementSibling as HTMLElement; if (n) n.style.display = 'inline'; }}
          />
          <span style={{ display: 'inline' }} className="text-sm font-bold text-white">Galya<span className="text-[#3b82f6]">Stream</span></span>
        </Link>
        <div className="hidden items-center md:flex">
          <div className="flex items-center gap-1 rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] px-2 py-1.5">
            {[{ href: '/', label: 'Ana Sayfa' }, { href: '/#paketler', label: 'Paketler' }, { href: '/#ozellikler', label: 'Özellikler' }, { href: '/#sss', label: 'SSS' }].map(item => (
              <Link key={item.href} href={item.href} className="rounded-xl px-4 py-1.5 text-sm font-medium text-[#8b9ab3] transition-colors hover:bg-[#162035] hover:text-white">{item.label}</Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link href="/profil" className="flex items-center gap-2 text-sm font-medium text-[#8b9ab3] transition-colors hover:text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-bold text-[#3b82f6]">{name[0]?.toUpperCase() || 'U'}</span>
                <span className="hidden md:inline">Profilim</span>
              </Link>
              <Link href="/abonelik" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600">
                <span className="hidden sm:inline">Premium&apos;a </span>Geç
              </Link>
            </>
          ) : (
            <>
              <Link href="/giris" className="text-sm font-medium text-[#8b9ab3] hover:text-white">Giriş Yap</Link>
              <Link href="/kayit" className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-bold text-white hover:bg-[#2563eb]">Kayıt Ol</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AbonelikInner() {
  const prices = usePrices();
  return (
    <div className="min-h-screen bg-[#060d18] text-white">
      <AbonelikHeader />
      <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-center">
        <p className="text-xs font-semibold text-amber-400 sm:text-sm">
          👑 Deneme süreniz sınırlı — şimdi premium&apos;a geçerek tüm içeriklere sınırsız erişim kazanın!
        </p>
      </div>
      <main className="mx-auto max-w-3xl px-3 py-8 sm:px-4 sm:py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">Abonelik Satın Al</h1>
          <p className="text-sm text-[#5a6a80]">Binlerce film, dizi ve canlı yayın seni bekliyor</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b82f6]">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-white">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
              </span>
              <span className="text-sm font-bold text-white">Plan Seçin</span>
            </div>
            <div className="h-px w-10 bg-[#1e2d42]" />
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1e2d42] bg-[#060e1a]">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#4b5563]">
                  <path d="M2.5 4A1.5 1.5 0 001 5.5v1h18v-1A1.5 1.5 0 0017.5 4h-15zM19 8.5H1V14.5A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5V8.5zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" />
                </svg>
              </span>
              <span className="text-sm text-[#4b5563]">Ödeme</span>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={{ ...plan, basePrice: prices[plan.id] ?? plan.basePrice }} />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[#1e2d42]">
          Sorunuz mu var?{' '}
          <a href="https://wa.me/447441921660" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">
            WhatsApp&apos;tan iletişime geçin
          </a>
        </p>
      </main>
    </div>
  );
}

export default function AbonelikPage() {
  return <SessionProvider><AbonelikInner /></SessionProvider>;
}
