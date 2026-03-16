'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, SessionProvider } from 'next-auth/react';


// ─── Fiyatları API'den okfu ────────────────────────────────────────────────────
const DEFAULT_PRICES: Record<string, number> = { max: 229.90, sports: 159.90, cinema: 129.90 };

function usePrices() {
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES);
  useEffect(() => {
    fetch('/api/prices')
      .then(r => r.json())
      .then(d => { if (d.success && d.prices) setPrices(d.prices); })
      .catch(() => { /* varsayılan fiyatlar kullan */ });
  }, []);
  return prices;
}

type DurKey = '1ay' | '6ay' | '12ay';
interface Dur { key: DurKey; label: string; months: number; discount: number; badge?: string }

const DURATIONS: Dur[] = [
  { key: '12ay', label: '1 Yıl', months: 12, discount: 20, badge: '%20 İNDİRİM · EN İYİ FİYAT' },
  { key: '6ay',  label: '6 Ay',  months: 6,  discount: 5,  badge: '%5 İNDİRİM' },
  { key: '1ay',  label: '1 Ay',  months: 1,  discount: 0 },
];

interface Plan {
  id: string; logo: string; logoAlt: string; name: string; desc: string;
  basePrice: number; popular: boolean; accentColor: string; features: string[];
}

const PLANS: Plan[] = [
  { id: 'max', logo: '/paket-logoları/logo-max.png', logoAlt: 'GalyaStream Max', name: 'Max',
    desc: 'Tüm içeriklere sınırsız erişim — film, dizi, spor ve TV kanalları bir arada.',
    basePrice: 229.90, popular: true, accentColor: '#ef4444',
    features: ['TV + Spor + Film + Dizi Tek Pakette','15.000+ Güncel İçerik ve Platform Arşivi','Yetişkin İçeriklere Dahil Erişim','HD / FHD / 4K Yüksek Kalite Yayın','Tüm Cihazlarda Kesintisiz İzleme'] },
  { id: 'sports', logo: '/paket-logoları/logo-sports.png', logoAlt: 'GalyaStream Sports', name: 'Sports',
    desc: 'Tüm spor yayınları ve TV kanalları — maçlar, turnuvalar tek yerde.',
    basePrice: 159.90, popular: false, accentColor: '#22c55e',
    features: ['Canlı Spor Kanalları ve Maç Yayınları','Avrupa ve Yerel Spor Kanalları Tek Yerde','HD / FHD / 4K Akıcı Yayın Deneyimi','Hızlı Kanal Geçişi ve Stabil İzleme','Smart TV ve Tüm Cihazlarla Uyumlu'] },
  { id: 'cinema', logo: '/paket-logoları/logo-cinema.png', logoAlt: 'GalyaStream Cinema', name: 'Cinema',
    desc: '15.000+ film ve dizi seçkisi — en popüler ve sevilen yapımlar bir arada.',
    basePrice: 129.90, popular: false, accentColor: '#f59e0b',
    features: ['15.000+ Film ve Dizi Arşivi','En Popüler ve Yeni Eklenen Yapımlar','Altyazı ve Dublaj Seçenekleri','HD / FHD / 4K Sinema Kalitesi','Telefon, Tablet ve Smart TV Uyumlu'] },
];

function calcTotal(base: number, months: number, discount: number) {
  return Math.round(base * (1 - discount / 100) * months * 100) / 100;
}
function fmtTL(n: number) { const [i, d] = n.toFixed(2).split('.'); return `${i},${d}`; }

function AbonelikHeader() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const name = session?.user?.name || session?.user?.email?.split('@')[0] || 'U';
  return (
    <div className="sticky top-0 z-50 border-b border-[#1e2d42] bg-[#07111f]/95 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="GalyaStream" className="h-8 w-auto" style={{ display: 'none' }} onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.display='block'; const n=e.currentTarget.nextElementSibling as HTMLElement; if(n) n.style.display='none'; }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; const n=e.currentTarget.nextElementSibling as HTMLElement; if(n) n.style.display='inline'; }} />
          <span style={{ display: "inline" }} className="text-sm font-bold text-white">Galya<span className="text-[#3b82f6]">Stream</span></span>
        </Link>
        <div className="hidden items-center md:flex">
          <div className="flex items-center gap-1 rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] px-2 py-1.5">
            {[{href:'/',label:'Ana Sayfa'},{href:'/#paketler',label:'Paketler'},{href:'/#ozellikler',label:'Özellikler'},{href:'/#sss',label:'SSS'}].map(item => (
              <Link key={item.href} href={item.href} className="rounded-xl px-4 py-1.5 text-sm font-medium text-[#8b9ab3] transition-colors hover:bg-[#162035] hover:text-white">{item.label}</Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link href="/profil" className="flex items-center gap-2 text-sm font-medium text-[#8b9ab3] transition-colors hover:text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-bold text-[#3b82f6]">{name[0]?.toUpperCase()||'U'}</span>
                <span className="hidden md:inline">Profilim</span>
              </Link>
              <Link href="/abonelik" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600"><span className="hidden sm:inline">Premium&apos;a </span>Geç</Link>
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

function PlanRow({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false);
  const [selDur, setSelDur] = useState<DurKey>('12ay');
  const [selDevices, setSelDevices] = useState<1|2|3>(2);
  const dur = DURATIONS.find(d => d.key === selDur)!;
  const total = calcTotal(plan.basePrice, dur.months, dur.discount);
  const monthly = total / dur.months;
  const origTotal = plan.basePrice * dur.months;
  const deviceMultiplier = selDevices === 1 ? 1 : selDevices === 2 ? 1.30 : 1.60;
  const grandTotal = Math.round(total * deviceMultiplier * 100) / 100;
  const odemeUrl = `/odeme?paket=${encodeURIComponent(plan.name)}&sure=${encodeURIComponent(dur.label)}&toplam=${grandTotal.toFixed(2)}&orijinal=${(plan.basePrice * dur.months).toFixed(2)}&indirim=${dur.discount}&cihaz=${selDevices}`;

  return (
    <div className="overflow-hidden rounded-2xl border transition-all duration-200"
      style={{ borderColor: open ? plan.accentColor+'60' : '#1e2d42', borderLeftWidth: open?3:1, borderLeftColor: open?plan.accentColor:'#1e2d42', backgroundColor: open?'#0a1020':'#08111e' }}>
      <button className="flex w-full items-center gap-4 px-5 py-4 text-left" onClick={() => setOpen(v=>!v)}>
        <div className="flex h-10 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0d1525] p-1 sm:h-12 sm:w-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plan.logo} alt={plan.logoAlt} className="h-full w-full object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; (e.currentTarget.nextElementSibling as HTMLElement).style.display='flex'; }} />
          <span className="hidden w-full items-center justify-center text-xs font-bold text-white">{plan.name}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold text-white sm:text-lg">{plan.name}</p>
            {plan.popular && <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white">★ POPÜLER</span>}
          </div>
          <p className="mt-0.5 truncate text-sm text-[#8b9ab3]">{plan.desc}</p>
        </div>
        <div className="shrink-0 text-right mr-2">
          <p className="text-xl font-extrabold text-white sm:text-2xl">₺{fmtTL(plan.basePrice)}</p>
          <p className="text-xs text-[#6b7280]">/ay</p>
        </div>
        <svg viewBox="0 0 20 20" fill="currentColor" className={`h-5 w-5 shrink-0 text-[#4b5563] transition-transform ${open?'rotate-180':''}`}>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
        </svg>
      </button>

      {open && (
        <div className="border-t border-[#1e2d42]/60 px-5 pb-6 pt-5 space-y-6">
          {/* Özellikler */}
          <div className="grid grid-cols-1 gap-y-2 gap-x-8 sm:grid-cols-2">
            {plan.features.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-[#9ca3af]">
                <span className="text-[#6b7280]">•</span>{f}
              </div>
            ))}
          </div>

          {/* Abonelik Süresi */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#6b7280]">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd"/>
              </svg>
              <p className="text-sm font-semibold text-white">Abonelik Süresi</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {DURATIONS.map(d => {
                const t = calcTotal(plan.basePrice, d.months, d.discount);
                const mo = t / d.months;
                const orig = plan.basePrice * d.months;
                const isSel = selDur === d.key;
                return (
                  <button key={d.key} onClick={() => setSelDur(d.key)}
                    className={`relative flex flex-col rounded-xl border p-3 text-left transition-all ${isSel?'border-[#3b82f6]/60 bg-[#0d1a2a]':'border-[#1e2d42] bg-[#060e1a] hover:border-[#1e3a5f]'}`}>
                    {d.badge && <span className={`absolute -top-2.5 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold text-white ${d.discount>=20?'bg-emerald-600':'bg-[#3b82f6]'}`}>⚡ {d.badge}</span>}
                    <p className="text-sm font-bold text-white mt-1">{d.label}</p>
                    {d.discount > 0 && <p className="text-[11px] line-through text-[#4b5563]">₺{fmtTL(orig)}</p>}
                    <p className="text-base font-extrabold text-white">₺{fmtTL(t)}</p>
                    <p className="text-[11px] text-[#6b7280]">aylık ₺{fmtTL(mo)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Eş Zamanlı İzleme */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#6b7280]">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z"/>
              </svg>
              <p className="text-sm font-semibold text-white">Eş Zamanlı İzleme</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {([
                {n:2 as const,label:'2 Cihaz',sub:'Arkadaş',note:'Süre seçince fiyat belirlenir',recommended:true},
                {n:1 as const,label:'1 Cihaz',sub:'Bireysel',note:'Ek ücret yok',recommended:false},
                {n:3 as const,label:'3 Cihaz',sub:'Aile',note:'Süre seçince fiyat belirlenir',recommended:false},
              ] as const).map(item => (
                <button key={item.n} onClick={() => setSelDevices(item.n)}
                  className={`relative flex flex-col rounded-xl border p-3 text-left transition-all ${selDevices===item.n?'border-[#3b82f6]/60 bg-[#0d1a2a]':'border-[#1e2d42] bg-[#060e1a] hover:border-[#1e3a5f]'}`}>
                  {item.recommended && <span className="absolute -top-2.5 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">★ ÖNERİLEN</span>}
                  <p className="text-sm font-bold text-white mt-1">{item.label}</p>
                  <p className="text-[11px] text-[#8b9ab3]">{item.sub}</p>
                  <p className="mt-1 text-[11px] text-[#6b7280]">{item.note}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fiyat özeti */}
          <div className="rounded-xl border border-[#1e2d42] bg-[#060e1a] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-[#8b9ab3]">{plan.name} · {dur.label} · {selDevices} Cihaz</p>
              <div className="text-right">
                {dur.discount > 0 && <p className="text-[11px] line-through text-[#4b5563]">₺{fmtTL(origTotal)}</p>}
                <p className="text-xl font-extrabold text-white sm:text-2xl">₺{fmtTL(grandTotal)}</p>
              </div>
            </div>
            <Link href={odemeUrl}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: plan.accentColor }}>
              Ödemeye Geç →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AbonelikInner() {
  const prices = usePrices();
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <AbonelikHeader />
      <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-center">
        <p className="text-xs font-semibold text-amber-400 sm:text-sm">
          👑 Deneme süreniz sınırlı — şimdi premium&apos;a geçerek tüm içeriklere sınırsız erişim kazanın!
        </p>
      </div>
      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-10">
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">Premium&apos;a Yükselt</h1>
          <p className="text-sm text-[#6b7280]">Binlerce film, dizi ve canlı yayın seni bekliyor</p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b82f6]">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/></svg>
              </span>
              <span className="text-sm font-semibold text-white">Plan Seçin</span>
            </div>
            <div className="h-px w-10 bg-[#1e2d42]" />
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1e2d42] bg-[#060e1a]">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-[#6b7280]"><path d="M2.5 4A1.5 1.5 0 001 5.5v1h18v-1A1.5 1.5 0 0017.5 4h-15zM19 8.5H1V14.5A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5V8.5zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z"/></svg>
              </span>
              <span className="text-sm text-[#6b7280]">Ödeme</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {PLANS.map(plan => (
            <PlanRow key={plan.id} plan={{ ...plan, basePrice: prices[plan.id] ?? plan.basePrice }} />
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-[#374151]">
          Sorunuz mu var?{' '}
          <a href="https://wa.me/447441921660" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">WhatsApp&apos;tan iletişime geçin</a>
        </p>
      </main>
    </div>
  );
}

export default function AbonelikPage() {
  return <SessionProvider><AbonelikInner /></SessionProvider>;
}
