'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Veri ──────────────────────────────────────────────────────────────────────
type DurKey = '3ay' | '6ay' | '12ay';
interface Dur { key: DurKey; label: string; months: number; discount: number; badge?: string }

const DURATIONS: Dur[] = [
  { key: '12ay', label: '1 Yıl',  months: 12, discount: 20, badge: '%20 İNDİRİM · EN İYİ FİYAT' },
  { key: '6ay',  label: '6 Ay',   months: 6,  discount: 5,  badge: '%5 İNDİRİM' },
  { key: '3ay',  label: '3 Ay',   months: 3,  discount: 0 },
];

interface Plan {
  id:        string;
  logo:      string;
  logoAlt:   string;
  name:      string;
  desc:      string;
  basePrice: number;
  popular:   boolean;
  accentColor: string;
  features:  string[];
}

const PLANS: Plan[] = [
  {
    id: 'max',
    logo: '/paket-logoları/logo-max.png',
    logoAlt: 'Montana Max',
    name: 'Max',
    desc: 'Tüm içeriklere sınırsız erişim — film, dizi, spor ve TV kanalları bir arada.',
    basePrice: 229.90,
    popular: true,
    accentColor: '#ef4444',
    features: ['TV + Spor + Film + Dizi Tek Pakette', '15.000+ Güncel İçerik ve Platform Arşivi', 'Yetişkin İçeriklere Dahil Erişim', 'HD / FHD / 4K Yüksek Kalite Yayın', 'Tüm Cihazlarda Kesintisiz İzleme'],
  },
  {
    id: 'sports',
    logo: '/paket-logoları/logo-sports.png',
    logoAlt: 'Montana Sports',
    name: 'Sports',
    desc: 'Tüm spor yayınları ve TV kanalları — maçlar, turnuvalar tek yerde.',
    basePrice: 159.90,
    popular: false,
    accentColor: '#22c55e',
    features: ['Canlı Spor Kanalları ve Maç Yayınları', 'Avrupa ve Yerel Spor Kanalları Tek Yerde', 'HD / FHD / 4K Akıcı Yayın Deneyimi', 'Hızlı Kanal Geçişi ve Stabil İzleme', 'Smart TV ve Tüm Cihazlarla Uyumlu'],
  },
  {
    id: 'cinema',
    logo: '/paket-logoları/logo-cinema.png',
    logoAlt: 'Montana Cinema',
    name: 'Cinema',
    desc: '15.000+ film ve dizi seçkisi — en popüler ve sevilen yapımlar bir arada.',
    basePrice: 129.90,
    popular: false,
    accentColor: '#f59e0b',
    features: ['15.000+ Film ve Dizi Arşivi', 'En Popüler ve Yeni Eklenen Yapımlar', 'Altyazı ve Dublaj Seçenekleri', 'HD / FHD / 4K Sinema Kalitesi', 'Telefon, Tablet ve Smart TV Uyumlu'],
  },
];

function calcTotal(base: number, months: number, discount: number): number {
  return Math.round(base * (1 - discount / 100) * months * 100) / 100;
}
function fmtTL(n: number): string {
  const [i, d] = n.toFixed(2).split('.');
  return `${i},${d}`;
}

// ─── Tek plan satırı + açılır detay ─────────────────────────────────────────
function PlanRow({ plan }: { plan: Plan }) {
  const [open,        setOpen]        = useState(false);
  const [selDur,      setSelDur]      = useState<DurKey>('12ay');
  const [selDevices,  setSelDevices]  = useState<1 | 2 | 3>(1);

  const dur     = DURATIONS.find(d => d.key === selDur)!;
  const total   = calcTotal(plan.basePrice, dur.months, dur.discount);
  const monthly = total / dur.months;

  // Cihaz sayısı extra ücret
  const deviceExtra = selDevices === 1 ? 0 : selDevices === 2 ? 0 : plan.basePrice * 0.5;
  const grandTotal  = total + deviceExtra * dur.months;

  const waText = `Merhaba, ${plan.name} ${dur.label} paket satın almak istiyorum.`;
  const odemeUrl = `/odeme?paket=${encodeURIComponent(plan.name)}&sure=${encodeURIComponent(dur.label)}&toplam=${grandTotal.toFixed(2)}&orijinal=${(plan.basePrice * dur.months).toFixed(2)}&indirim=${dur.discount}`;

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${open ? 'border-[#1e2d42] bg-[#0a1525]' : 'border-[#1e2d42] bg-[#0a1020] hover:border-[#1e3a5f] hover:bg-[#0c1525]'}`}
      style={{ borderLeftWidth: open ? 3 : 1, borderLeftColor: open ? plan.accentColor : undefined }}>

      {/* Satır başlığı */}
      <button className="flex w-full items-center gap-4 px-5 py-4 text-left" onClick={() => setOpen(v => !v)}>
        {/* Logo */}
        <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#1e2d42] bg-[#111827] p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plan.logo} alt={plan.logoAlt} className="h-full w-full object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; (e.currentTarget.nextElementSibling as HTMLElement).style.display='flex'; }} />
          <span className="hidden w-full items-center justify-center text-xs font-bold text-white">{plan.name}</span>
        </div>
        {/* Açıklama */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-white">{plan.name}</p>
            {plan.popular && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">★ POPÜLER</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-[#6b7280]">{plan.desc}</p>
        </div>
        {/* Fiyat */}
        <div className="shrink-0 text-right">
          <p className="font-extrabold text-white">₺{fmtTL(plan.basePrice)}</p>
          <p className="text-[11px] text-[#6b7280]">/ay</p>
        </div>
        {/* Chevron */}
        <svg viewBox="0 0 20 20" fill="currentColor"
          className={`ml-2 h-5 w-5 shrink-0 text-[#4b5563] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
        </svg>
      </button>

      {/* Açılır içerik */}
      {open && (
        <div className="border-t border-[#1e2d42] px-5 pb-6 pt-5 space-y-6">
          {/* Özellikler — 2 sütun */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#6b7280]">Paket İçeriği</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-[#9ca3af]">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]" style={{ backgroundColor: `${plan.accentColor}20`, color: plan.accentColor }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Abonelik Süresi */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#6b7280]">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd"/>
              </svg>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6b7280]">Abonelik Süresi</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map(d => {
                const t     = calcTotal(plan.basePrice, d.months, d.discount);
                const mo    = t / d.months;
                const isSelected = selDur === d.key;
                return (
                  <button key={d.key} onClick={() => setSelDur(d.key)}
                    className={`relative flex flex-col items-start rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-[#3b82f6]/60 bg-[#0d1a2a]' : 'border-[#1e2d42] bg-[#060e1a] hover:border-[#1e3a5f]'}`}>
                    {d.badge && (
                      <span className={`absolute -top-2.5 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold text-white ${d.discount === 20 ? 'bg-emerald-600' : 'bg-[#3b82f6]'}`}>
                        {d.badge}
                      </span>
                    )}
                    <p className="text-sm font-bold text-white">{d.label}</p>
                    <p className="text-base font-extrabold text-white mt-0.5">
                      ₺{fmtTL(t)}
                    </p>
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6b7280]">Eş Zamanlı İzleme</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { n: 1 as const, label: '1 Cihaz',  sub: 'Bireysel',  note: 'Ek ücret yok',   recommended: false },
                { n: 2 as const, label: '2 Cihaz',  sub: 'Arkadaş',  note: 'Önerilen',        recommended: true  },
                { n: 3 as const, label: '3 Cihaz',  sub: 'Aile',     note: 'Süreye göre fiyat', recommended: false },
              ] as const).map(item => (
                <button key={item.n} onClick={() => setSelDevices(item.n)}
                  className={`relative flex flex-col rounded-xl border p-3 text-left transition-all ${selDevices === item.n ? 'border-[#3b82f6]/60 bg-[#0d1a2a]' : 'border-[#1e2d42] bg-[#060e1a] hover:border-[#1e3a5f]'}`}>
                  {item.recommended && (
                    <span className="absolute -top-2.5 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">★ ÖNERİLEN</span>
                  )}
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="text-[11px] text-[#8b9ab3]">{item.sub}</p>
                  <p className="mt-1 text-[11px] text-[#6b7280]">{item.note}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Fiyat özeti + Butonlar */}
          <div className="rounded-xl border border-[#1e2d42] bg-[#060e1a] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-[#8b9ab3]">{plan.name} · {dur.label} · {selDevices} Cihaz</p>
              <div className="text-right">
                {dur.discount > 0 && (
                  <p className="text-[11px] line-through text-[#4b5563]">₺{fmtTL(plan.basePrice * dur.months)}</p>
                )}
                <p className="text-xl font-extrabold text-white">₺{fmtTL(grandTotal)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={odemeUrl}
                className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold text-white transition-all"
                style={{ backgroundColor: plan.accentColor }}>
                Ödemeye Geç →
              </Link>
              <a href={`https://wa.me/447441921660?text=${encodeURIComponent(waText)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#25d366]/30 bg-[#25d366]/10 px-4 py-3 text-sm font-semibold text-[#25d366] transition-all hover:bg-[#25d366]/20">
                💬 WA
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function AbonelikPage() {
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      {/* Header */}
      <div className="border-b border-[#1e2d42] bg-[#07111f]/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Galya IPTV" className="h-8 w-auto"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
            <span className="text-sm font-bold text-white">Galya <span className="text-[#3b82f6]">IPTV</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/profil" className="text-xs text-[#6b7280] transition-colors hover:text-white">Profilim</Link>
            <Link href="/#paketler" className="rounded-xl border border-[#1e2d42] px-3 py-1.5 text-xs text-[#8b9ab3] transition-colors hover:text-white">Ana Sayfa</Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* Deneme süresi uyarısı */}
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3">
          <span className="text-base">👑</span>
          <p className="text-sm text-amber-300">
            Deneme süreniz sınırlı — şimdi premium&apos;a geçerek tüm içeriklere sınırsız erişim kazanın!
          </p>
        </div>

        {/* Başlık + adım göstergesi */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-black tracking-tight">Premium&apos;a Yükselt</h1>
          <p className="text-sm text-[#6b7280]">Binlerce film, dizi ve canlı yayın seni bekliyor</p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-bold text-white">1</span>
              <span className="text-sm font-semibold text-white">Plan Seçin</span>
            </div>
            <div className="h-px w-8 bg-[#1e2d42]" />
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#1e2d42] bg-[#060e1a] text-xs font-semibold text-[#6b7280]">2</span>
              <span className="text-sm text-[#6b7280]">Ödeme</span>
            </div>
          </div>
        </div>

        {/* Plan listesi */}
        <div className="space-y-3">
          {PLANS.map(plan => <PlanRow key={plan.id} plan={plan} />)}
        </div>

        {/* Alt not */}
        <p className="mt-6 text-center text-xs text-[#374151]">
          Sorunuz mu var?{' '}
          <a href="https://wa.me/447441921660" target="_blank" rel="noopener noreferrer"
            className="text-[#3b82f6] transition-colors hover:underline">
            WhatsApp&apos;tan iletişime geçin
          </a>
        </p>
      </main>
    </div>
  );
}
