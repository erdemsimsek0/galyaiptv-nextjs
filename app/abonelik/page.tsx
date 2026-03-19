'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SessionProvider, useSession } from 'next-auth/react';
import {
  DEFAULT_COUPONS,
  DEFAULT_DEVICE_MULTIPLIERS,
  DEFAULT_PRICES,
  applyCouponDiscount,
  calculatePlanTotal,
  normalizeCouponCode,
  type CouponDefinition,
} from '@/lib/catalog';

function usePricingConfig() {
  const [config, setConfig] = useState({ prices: DEFAULT_PRICES, deviceMultipliers: DEFAULT_DEVICE_MULTIPLIERS, coupons: DEFAULT_COUPONS });
  useEffect(() => {
    fetch('/api/prices')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setConfig({
            prices: d.prices || DEFAULT_PRICES,
            deviceMultipliers: d.deviceMultipliers || DEFAULT_DEVICE_MULTIPLIERS,
            coupons: d.coupons || DEFAULT_COUPONS,
          });
        }
      })
      .catch(() => {});
  }, []);
  return config;
}

function useSubscription(email: string | null | undefined): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!email) return;
    fetch(`/api/subscription?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setActive(true); })
      .catch(() => {});
  }, [email]);
  return active;
}

const SUBSCRIBER_EXTRA = 25;
interface DurationOption { key: '12ay' | '6ay' | '3ay'; label: string; months: number; discount: number; badge?: string; badgeCls?: string }
interface DeviceOption { n: 1 | 2 | 3; label: string; sub: string; badge?: string; badgeCls?: string }
interface PlanOption {
  id: 'max' | 'sports' | 'cinema';
  lt: string;
  ltColor: string;
  name: string;
  popular: boolean;
  color: string;
  openCls: string;
  selCls: string;
  desc: string;
  basePrice: number;
  features: string[];
}


const DURATIONS: DurationOption[] = [
  { key: '12ay', label: '12 Ay', months: 12, discount: 20, badge: '%20 İNDİRİM', badgeCls: 'bg-emerald-600' },
  { key: '6ay', label: '6 Ay', months: 6, discount: 5, badge: '%5 İNDİRİM', badgeCls: 'bg-blue-600' },
  { key: '3ay', label: '3 Ay', months: 3, discount: 0 },
] as const;
const DEVICES: DeviceOption[] = [
  { n: 2 as const, label: '2 Cihaz', sub: 'Arkadaş', badge: '★ ÖNERİLEN', badgeCls: 'bg-amber-500' },
  { n: 1 as const, label: '1 Cihaz', sub: 'Bireysel' },
  { n: 3 as const, label: '3 Cihaz', sub: 'Aile' },
];
const PLANS: PlanOption[] = [
  {
    id: 'max', lt: 'MAX', ltColor: '#ef4444', name: 'Max', popular: true,
    color: '#ef4444', openCls: 'border-l-[#ef4444] border-[#ef444433]', selCls: 'border-[#ef444466] bg-[#0d0a0a]',
    desc: 'Tüm içeriklere sınırsız erişim — film, dizi, spor ve TV kanalları bir arada.',
    basePrice: 229.9,
    features: ['TV + Spor + Film + Dizi Tek Pakette', '15.000+ Güncel İçerik Arşivi', 'Yetişkin İçerikler', 'HD / FHD / 4K Yayın', 'Tüm Cihazlarla Uyumlu', 'Hızlı Kanal Geçişi'],
  },
  {
    id: 'sports', lt: 'SPORTS', ltColor: '#22c55e', name: 'Sports', popular: false,
    color: '#22c55e', openCls: 'border-l-[#22c55e] border-[#22c55e33]', selCls: 'border-[#22c55e66] bg-[#071a0e]',
    desc: 'Tüm spor yayınları ve TV kanalları — maçlar, turnuvalar tek yerde.',
    basePrice: 159.9,
    features: ['Canlı Spor Kanalları', 'Avrupa ve Yerel Ligler', 'HD / FHD / 4K', 'Stabil yayın altyapısı', 'Smart TV uyumu', 'Maç keyfi için optimize'],
  },
  {
    id: 'cinema', lt: 'CINEMA', ltColor: '#f59e0b', name: 'Cinema', popular: false,
    color: '#f59e0b', openCls: 'border-l-[#f59e0b] border-[#f59e0b33]', selCls: 'border-[#f59e0b66] bg-[#150e00]',
    desc: '15.000+ film ve dizi seçkisi — en popüler yapımlar bir arada.',
    basePrice: 129.9,
    features: ['15.000+ Film ve Dizi', 'Yeni Yapımlar', 'Altyazı ve Dublaj', 'HD / FHD / 4K', 'Telefon, tablet, TV desteği', 'Kolay kullanım'],
  },
] as const;

function fmt(n: number) {
  const [i, d] = n.toFixed(2).split('.');
  return `${i},${d}`;
}

function PlanCard({
  plan,
  isSubscriber,
  deviceMultipliers,
  coupons,
}: {
  plan: PlanOption;
  isSubscriber: boolean;
  deviceMultipliers: Record<number, number>;
  coupons: CouponDefinition[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption['key']>('6ay');
  const [selectedDevice, setSelectedDevice] = useState<1 | 2 | 3>(2);
  const [couponCode, setCouponCode] = useState('');

  const duration = DURATIONS.find(item => item.key === selectedDuration)!;
  const multiplier = deviceMultipliers[selectedDevice] ?? 1;
  const effectiveDiscount = isSubscriber ? Math.min(100, duration.discount + SUBSCRIBER_EXTRA) : duration.discount;
  const originalTotal = Math.round(plan.basePrice * duration.months * multiplier * 100) / 100;
  const baseTotal = calculatePlanTotal(plan.basePrice, duration.months, effectiveDiscount, multiplier);
  const normalTotal = calculatePlanTotal(plan.basePrice, duration.months, duration.discount, multiplier);
  const coupon = coupons.find(item => normalizeCouponCode(item.code) === normalizeCouponCode(couponCode));
  const couponError = !couponCode.trim()
    ? ''
    : !coupon
    ? 'Kupon bulunamadı.'
    : coupon.minMonths && duration.months < coupon.minMonths
    ? `Bu kupon en az ${coupon.minMonths} ay için geçerli.`
    : coupon.allowedPlans && !coupon.allowedPlans.includes(plan.id)
    ? 'Bu kupon bu pakette geçerli değil.'
    : coupon.allowedDevices && !coupon.allowedDevices.includes(selectedDevice)
    ? 'Bu kupon seçilen cihaz sayısında geçerli değil.'
    : coupon.expiresAt && coupon.expiresAt < Date.now()
    ? 'Kuponun süresi dolmuş.'
    : !coupon.active
    ? 'Kupon aktif değil.'
    : '';
  const couponDiscount = coupon && !couponError ? applyCouponDiscount(baseTotal, coupon) : 0;
  const total = Math.max(0, Math.round((baseTotal - couponDiscount) * 100) / 100);
  const subscriberDiscount = Math.max(0, normalTotal - baseTotal);

  const paymentUrl = `/odeme?paket=${encodeURIComponent(plan.name)}&planId=${plan.id}&sure=${encodeURIComponent(duration.label)}&ay=${duration.months}&toplam=${total.toFixed(2)}&ara_toplam=${baseTotal.toFixed(2)}&orijinal=${originalTotal.toFixed(2)}&indirim=${effectiveDiscount}&cihaz=${selectedDevice}&cihaz_carpan=${multiplier}${isSubscriber ? `&abone=1&abone_indirim=${subscriberDiscount.toFixed(2)}` : ''}${couponDiscount > 0 && coupon ? `&kupon=${encodeURIComponent(coupon.code)}&kupon_indirim=${couponDiscount.toFixed(2)}` : ''}`;

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all duration-200 ${open ? `border-2 border-l-[3px] ${plan.openCls} bg-[#0a1320]` : 'border border-[#131f30] bg-[#0a1320]'}`}>
      <button className="flex w-full items-center gap-3 px-5 py-4 text-left" onClick={() => setOpen(v => !v)}>
        <div className="flex h-11 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-[#1a2840] bg-[#0d1525]">
          <span className="text-xs font-black tracking-wide" style={{ color: plan.ltColor }}>{plan.lt}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-extrabold text-white">{plan.name}</span>
            {plan.popular && <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black text-[#412402]">★ POPÜLER</span>}
          </div>
          <p className="mt-0.5 truncate text-xs text-[#5a6a80]">{plan.desc}</p>
        </div>
        <div className="mr-2 flex-shrink-0 text-right">
          <p className="text-2xl font-black text-white">₺{fmt(plan.basePrice)}</p>
          <p className="text-[10px] text-[#4b5563]">/ay baz fiyat</p>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#111e2e] px-5 pb-6 pt-5 space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {plan.features.map(feature => (
              <div key={feature} className="flex items-start gap-2 text-xs text-[#7a8a9e]">
                <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2a3a4e]" />
                {feature}
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2.5 text-xs font-bold text-[#c0cfe0]">Abonelik Süresi</div>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map(item => {
                const discount = isSubscriber ? Math.min(100, item.discount + SUBSCRIBER_EXTRA) : item.discount;
                const currentTotal = calculatePlanTotal(plan.basePrice, item.months, discount, 1);
                const orig = Math.round(plan.basePrice * item.months * 100) / 100;
                const active = selectedDuration === item.key;
                return (
                  <button key={item.key} onClick={() => setSelectedDuration(item.key)} className={`relative rounded-[13px] border p-3 text-left transition-all ${active ? plan.selCls : 'border-[#131f30] bg-[#070f1c] hover:border-[#1e3a5f]'}`}>
                    {isSubscriber ? (
                      <span className="absolute -top-2.5 left-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white">%{discount} İND.</span>
                    ) : item.badge ? (
                      <span className={`absolute -top-2.5 left-2 rounded-full px-2 py-0.5 text-[9px] font-black text-white ${item.badgeCls}`}>{item.badge}</span>
                    ) : null}
                    <p className={`text-xs font-bold text-white ${(isSubscriber || item.badge) ? 'mt-2' : 'mt-0.5'}`}>{item.label}</p>
                    {discount > 0 && <p className="text-[10px] text-[#2a3a4e] line-through">₺{fmt(orig)}</p>}
                    <p className="text-base font-black text-white">₺{fmt(currentTotal)}</p>
                    <p className="text-[10px] text-[#4a5a70]">{item.months} ay toplam</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2.5 text-xs font-bold text-[#c0cfe0]">Eş Zamanlı İzleme</div>
            <div className="grid grid-cols-3 gap-2">
              {DEVICES.map(device => {
                const active = selectedDevice === device.n;
                const currentMultiplier = deviceMultipliers[device.n] ?? 1;
                return (
                  <button key={device.n} onClick={() => setSelectedDevice(device.n)} className={`relative rounded-[13px] border p-3 text-left transition-all ${active ? plan.selCls : 'border-[#131f30] bg-[#070f1c] hover:border-[#1e3a5f]'}`}>
                    {device.badge && <span className={`absolute -top-2.5 left-2 rounded-full px-2 py-0.5 text-[9px] font-black text-white ${device.badgeCls}`}>{device.badge}</span>}
                    <p className={`text-xs font-bold text-white ${device.badge ? 'mt-2' : 'mt-0.5'}`}>{device.label}</p>
                    <p className="text-[10px] text-[#5a6a80]">{device.sub}</p>
                    <p className="mt-0.5 text-[10px] text-[#3a4a5c]">{currentMultiplier === 1 ? 'Ek ücret yok' : `×${currentMultiplier} çarpan`}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#131f30] bg-[#070f1c] p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#c0cfe0]">🎟 Kampanya / Kupon Kodu</p>
              <span className="text-[10px] text-[#4a5a70]">Aktif kampanyalar otomatik uygulanır</span>
            </div>
            <div className="flex gap-2">
              <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="HOSGELDIN10" className="flex-1 rounded-xl border border-[#1e2d42] bg-[#0b1523] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3b82f6]" />
              <button type="button" onClick={() => setCouponCode('')} className="rounded-xl border border-[#1e2d42] px-3 py-2 text-xs text-[#8b9ab3] hover:text-white">Temizle</button>
            </div>
            {couponCode.trim() && <p className={`mt-2 text-xs ${couponError ? 'text-red-400' : 'text-emerald-400'}`}>{couponError || `${coupon?.label} uygulandı · -₺${fmt(couponDiscount)}`}</p>}
          </div>

          {isSubscriber && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2">
              <span className="text-emerald-400 text-sm">🔄</span>
              <p className="text-xs font-bold text-emerald-400">Uzatmaya özel %25 ek indirim uygulandı!</p>
            </div>
          )}

          <div className="rounded-2xl border border-[#131f30] bg-[#070f1c] p-4">
            <div className="mb-3 flex items-start justify-between">
              <p className="text-xs text-[#5a6a80]">{plan.name} · {duration.label} · {selectedDevice} Cihaz</p>
              <div className="text-right">
                <p className="text-[11px] text-[#2a3a4e] line-through">₺{fmt(originalTotal)}</p>
                {subscriberDiscount > 0 && <p className="text-[10px] text-emerald-400">-₺{fmt(subscriberDiscount)} abone indirimi</p>}
                {couponDiscount > 0 && <p className="text-[10px] text-amber-400">-₺{fmt(couponDiscount)} kupon indirimi</p>}
                <p className="text-2xl font-black text-white">₺{fmt(total)}</p>
              </div>
            </div>
            <Link href={paymentUrl} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white transition-opacity hover:opacity-90" style={{ backgroundColor: plan.color }}>
              Ödemeye Geç
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AbonelikInner() {
  const { data: session } = useSession();
  const { prices, deviceMultipliers, coupons } = usePricingConfig();
  const isSubscriber = useSubscription(session?.user?.email ?? null);

  return (
    <div className="min-h-screen bg-[#060d18] text-white">
      <div className="border-b border-[#1e2d42] bg-[#060d18]/95 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-sm font-bold">Galya<span className="text-[#3b82f6]">Stream</span></Link>
          <Link href="/profil" className="text-xs text-[#5a6a80] hover:text-white">Profil</Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black">Abonelik Paketleri</h1>
          <p className="mt-2 text-sm text-[#5a6a80]">Cihaz sayısına göre fiyatlandırma, kampanya kuponları ve uzatma indirimi burada.</p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-4">
            <p className="text-xs text-[#6b7280]">1 Cihaz</p>
            <p className="mt-2 text-xl font-bold text-white">×{deviceMultipliers[1]}</p>
          </div>
          <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-4">
            <p className="text-xs text-[#6b7280]">2 Cihaz</p>
            <p className="mt-2 text-xl font-bold text-white">×{deviceMultipliers[2]}</p>
          </div>
          <div className="rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-4">
            <p className="text-xs text-[#6b7280]">3 Cihaz</p>
            <p className="mt-2 text-xl font-bold text-white">×{deviceMultipliers[3]}</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-[#1e2d42] bg-[#0a1525] p-5">
          <p className="text-sm font-bold text-white">🎟 Aktif Kampanyalar</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {coupons.filter(coupon => coupon.active).map(coupon => (
              <span key={coupon.code} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {coupon.code} · {coupon.type === 'percent' ? `%${coupon.value}` : `₺${coupon.value}`} indirim
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={{ ...plan, basePrice: prices[plan.id] ?? plan.basePrice }}
              isSubscriber={isSubscriber}
              deviceMultipliers={deviceMultipliers}
              coupons={coupons}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AbonelikPage() {
  return (
    <SessionProvider>
      <AbonelikInner />
    </SessionProvider>
  );
}
