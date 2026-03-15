'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSession, SessionProvider } from 'next-auth/react';


function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

// ─── Fiyatları API'den oku ────────────────────────────────────────────────────
const DEFAULT_PRICES: Record<string, number> = { max: 229.90, sports: 159.90, cinema: 129.90 };

function usePrices() {
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES);
  useEffect(() => {
    fetch('/api/prices')
      .then(r => r.json())
      .then(d => { if (d.success && d.prices) setPrices(d.prices); })
      .catch(() => { /* varsayılan */ });
  }, []);
  return prices;
}

// ─── Metadata notu ────────────────────────────────────────────────────────────
// Bu sayfa 'use client' olduğundan metadata'yı layout.tsx'e ekle:
// export const metadata = {
//   title: 'Galya IPTV | Donmayan Premium IPTV – 85.000+ Kanal, 4K Yayın',
//   description: 'Donmayan premium IPTV hizmeti. 85.000+ kanal, 4K yayın kalitesi, Avrupa sunucuları. 3 saatlik ücretsiz test. Tüm cihazlarda çalışır.',
//   keywords: 'iptv satın al, iptv fiyat, 4k iptv, en iyi iptv, iptv server, donmayan iptv',
// }

const WHATSAPP_URL = 'https://wa.me/447441921660?text=Merhaba%2C%20sat%C4%B1n%20almak%20istiyorum.';
const WHATSAPP_BASE = 'https://wa.me/447441921660';

// ─── Süre seçenekleri ve iskonto oranları ────────────────────────────────────
type DurationKey = '3ay' | '6ay' | '12ay';
const DURATIONS: { key: DurationKey; label: string; months: number; discount: number; badge?: string }[] = [
  { key: '3ay',  label: '3 Ay',  months: 3,  discount: 0 },
  { key: '6ay',  label: '6 Ay',  months: 6,  discount: 5,  badge: '%5 İNDİRİM'  },
  { key: '12ay', label: '12 Ay', months: 12, discount: 20, badge: '%20 İNDİRİM' },
];

// Toplam fiyat (ay sayısı × aylık fiyat × indirim)
function calcTotalPrice(base: number, months: number, discount: number): number {
  const monthly = base * (1 - discount / 100);
  return Math.round(monthly * months * 100) / 100;
}

// Sayıyı TL formatında göster  → "159,90" veya "911,40"
function formatTL(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

// ─── Animasyonlu fiyat sayacı bileşeni ───────────────────────────────────────
function AnimatedPrice({ target, monthly, popular }: { target: number; monthly: number; popular: boolean }) {
  const [display, setDisplay]       = useState(target);
  const [displayMo, setDisplayMo]   = useState(monthly);
  const prevRef   = useRef(target);
  const prevMoRef = useRef(monthly);
  const rafRef    = useRef<number>(0);
  const rafMoRef  = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to   = target;
    if (from === to) { setDisplay(to); return; }
    prevRef.current = to;
    const duration = 550;
    const startTime = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
      else setDisplay(to);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  useEffect(() => {
    const from = prevMoRef.current;
    const to   = monthly;
    if (from === to) { setDisplayMo(to); return; }
    prevMoRef.current = to;
    const duration = 550;
    const startTime = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayMo(from + (to - from) * eased);
      if (t < 1) rafMoRef.current = requestAnimationFrame(animate);
      else setDisplayMo(to);
    };
    rafMoRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafMoRef.current);
  }, [monthly]);

  // Toplam fiyat — büyük
  const fmtTotal = formatTL(display);
  const [totInt, totDec] = fmtTotal.split(',');

  // Aylık fiyat — küçük parantez içi
  const fmtMo = formatTL(displayMo);

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Ana büyük rakam */}
      <div className="flex items-end gap-0.5 leading-none">
        <span className="text-[2.6rem] font-extrabold tracking-tight tabular-nums text-white">
          ₺{totInt}
        </span>
        <span className="mb-1 text-lg font-bold tabular-nums text-white">,{totDec}</span>
      </div>
      {/* Aylık küçük — sadece çok aylıkta göster */}
      <span className="mb-0.5 self-end text-[13px] font-medium tabular-nums text-[#6b7280]">
        (₺{fmtMo}/Ay)
      </span>
    </div>
  );
}

// ─── Kategori Paketleri (ana sayfa gösterimi) ─────────────────────────────────
// Sıra: Sports (sol) → Max (orta, popüler) → Cinema (sağ) — görsele uygun
const categoryPackages = [
  {
    id: 'spor',
    // Logo dosyası: /public/paket-logoları/logo-sports.png
    logo: '/paket-logoları/logo-sports.png',
    logoAlt: 'Montana Sports',
    name: 'Montana Sports',
    desc: 'Tüm spor yayınları ve TV kanalları — maçlar, turnuvalar tek yerde.',
    basePrice: 159.90,
    features: [
      { bold: true,  text: 'Canlı Spor Kanalları ve Maç Yayınları' },
      { bold: true,  text: 'Avrupa ve Yerel Spor Kanalları Tek Yerde' },
      { bold: false, text: 'HD / FHD / 4K Akıcı Yayın Deneyimi' },
      { bold: false, text: 'Hızlı Kanal Geçişi ve Stabil İzleme' },
      { bold: false, text: 'Smart TV ve Tüm Cihazlarla Uyumlu' },
    ],
    popular: false,
    ctaLabel: 'Spora Başla',
    waMsg: 'Sports paketi hakkında bilgi almak istiyorum.',
  },
  {
    id: 'max',
    // Logo dosyası: /public/paket-logoları/logo-max.png
    logo: '/paket-logoları/logo-max.png',
    logoAlt: 'Montana Max',
    name: 'Montana Max',
    desc: 'Tüm içeriklere sınırsız erişim — film, dizi, spor ve TV kanalları bir arada.',
    basePrice: 229.90,
    features: [
      { bold: true,  text: 'TV + Spor + Film + Dizi Tek Pakette' },
      { bold: true,  text: '15.000+ Güncel İçerik ve Platform Arşivi' },
      { bold: false, text: 'Yetişkin İçeriklere Dahil Erişim' },
      { bold: false, text: 'HD / FHD / 4K Yüksek Kalite Yayın' },
      { bold: false, text: 'Tüm Cihazlarda Kesintisiz İzleme' },
    ],
    popular: true,
    ctaLabel: 'En Popüleri Seç',
    waMsg: 'Max paketi hakkında bilgi almak istiyorum.',
  },
  {
    id: 'cinema',
    // Logo dosyası: /public/paket-logoları/logo-cinema.png
    logo: '/paket-logoları/logo-cinema.png',
    logoAlt: 'Montana Cinema',
    name: 'Montana Cinema',
    desc: '15.000+ film ve dizi seçkisi — en popüler ve sevilen yapımlar bir arada.',
    basePrice: 129.90,
    features: [
      { bold: true,  text: '15.000+ Film ve Dizi Arşivi' },
      { bold: true,  text: 'En Popüler ve Yeni Eklenen Yapımlar' },
      { bold: false, text: 'Altyazı ve Dublaj Seçenekleri' },
      { bold: false, text: 'HD / FHD / 4K Sinema Kalitesi' },
      { bold: false, text: 'Telefon, Tablet ve Smart TV Uyumlu' },
    ],
    popular: false,
    ctaLabel: 'İzlemeye Başla',
    waMsg: 'Cinema paketi hakkında bilgi almak istiyorum.',
  },
];

// ─── Modal için süre paketleri ─────────────────────────────────────────────────
const packages = [
  { name: '1 Aylık Paket', duration: '1 Ay IPTV', price: '500', monthlyPrice: '500', saving: null, forWho: 'Denemek isteyenler için', features: ['85.000+ Kanal', 'Full HD Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'], popular: false },
  { name: '3 Aylık Paket', duration: '3 Ay IPTV', price: '700', monthlyPrice: '233', saving: '%53', forWho: 'Kısa dönem kullanım', features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'], popular: false },
  { name: '6 Aylık Paket', duration: '6 Ay IPTV', price: '1.000', monthlyPrice: '167', saving: '%67', forWho: 'Fiyat / performans seçimi', features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'], popular: false },
  { name: '12 Aylık Paket', duration: '12 Ay IPTV', price: '1.400', monthlyPrice: '117', saving: '%77', forWho: 'En çok tercih edilen', features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'], popular: true },
  { name: '24 Aylık Paket', duration: '24 Ay IPTV', price: '2.200', monthlyPrice: '92', saving: '%82', forWho: 'En düşük aylık maliyet', features: ['85.000+ Kanal', '4K Ultra HD', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum', 'VIP Destek'], popular: false },
  { name: 'Süresiz Paket', duration: 'Sınırsız IPTV', price: '6.900', monthlyPrice: null, saving: null, forWho: 'Uzun vadeli kullanıcılar', features: ['85.000+ Kanal', '4K Ultra HD', '7/24 Destek', '2 Bağlantı', 'Ücretsiz Kurulum', 'VIP Destek'], popular: false },
];

const modalPackages = [
  { label: '1 Aylık Paket', price: '₺500' },
  { label: '3 Aylık Paket', price: '₺700' },
  { label: '6 Aylık Paket', price: '₺1.000' },
  { label: '12 Aylık Paket', price: '₺1.400', popular: true },
  { label: '24 Aylık Paket', price: '₺2.200' },
  { label: 'Süresiz Paket', price: '₺6.900' },
  { label: 'Henüz bilmiyorum', price: '' },
];

function getRecommendedPackage(device: string, purposes: string[]): string {
  if (purposes.includes('sports') && (device === 'smarttv' || device === 'tvbox')) return '12 Aylık Paket';
  if (purposes.includes('movies') && device === 'mobile') return '6 Aylık Paket';
  if (purposes.includes('foreign') && device === 'tvbox') return '24 Aylık Paket';
  if (purposes.includes('foreign')) return '12 Aylık Paket';
  if (purposes.includes('sports')) return '12 Aylık Paket';
  if (purposes.includes('movies')) return '6 Aylık Paket';
  return '12 Aylık Paket';
}

// ─── Müşteri yorumları ─────────────────────────────────────────────────────────
const reviews = [
  { initials: 'MK', name: 'Mehmet Kaya', city: 'Ankara', text: 'Başta şüpheciydim, 3 saatlik ücretsiz testi denedim. Kurulumda takıldım, destek ekibi uzaktan 5 dakikada halletti. 6 aydır donma yaşamadım.', stars: 5 },
  { initials: 'ZA', name: 'Zeynep Arslan', city: 'İzmir', text: '70 yaşındaki babam için aldım, kolayca kullanıyor. TRT, Show TV, ATV sorunsuz geliyor. Yerel kanallar ve spor mükemmel.', stars: 5 },
  { initials: 'CO', name: 'Can Özdemir', city: 'Londra', text: 'Premier Lig için aldım ama film arşivini keşfettim. Hafta sonu çıkan filmler var. Smart TV\'ye direkt açılıyor, harika.', stars: 5 },
  { initials: 'AY', name: 'Ayşe Yılmaz', city: 'İstanbul', text: 'Ücretsiz testi denedim, kaliteden ikna oldum ve hemen satın aldım. 4K destekli TV\'de spor kanalları muhteşem görünüyor.', stars: 5 },
  { initials: 'SO', name: 'Selim Öztürk', city: 'Bursa', text: 'WhatsApp\'tan kurulum desteği aldım, çok hızlı yardımcı oldular. Smart TV\'ye kolayca kuruldu. Kesinlikle tavsiye ederim.', stars: 5 },
  { initials: 'EC', name: 'Elif Çelik', city: 'Antalya', text: 'Farklı sağlayıcılar denedim ama en stabil bu oldu. Yurt dışından Türkçe kanalları izlemek için mükemmel, VPN gerekmedi.', stars: 5 },
];

const faqs = [
  { q: 'Ücretsiz test nasıl çalışır?', a: 'E-posta adresinizi doğruladıktan sonra 3 saatlik test hesabınız anında açılır. Kredi kartı bilgisi gerekmez, tüm içeriklere erişebilirsiniz.' },
  { q: 'Ücret iadesi politikanız nedir?', a: 'Herhangi bir sorun yaşarsanız destek hattımız çözüm garantisi verir. WhatsApp üzerinden 7/24 yardım sağlıyoruz.' },
  { q: 'Smart TV\'de çalışır mı?', a: 'Evet, Samsung, LG, Vestel ve Sony Smart TV\'lerde doğrudan çalışır. Kurulum kılavuzu satın alma sonrası WhatsApp\'tan gönderilir.' },
  { q: 'Kurulum ne kadar sürer?', a: '5 dakika yeterlidir. Eğer zorlanırsanız destek ekibimiz WhatsApp üzerinden adım adım yardımcı olur, gerekirse uzaktan kurulum yapılır.' },
  { q: 'Donma sorunu yaşar mıyım?', a: 'Avrupa tabanlı sunucularımızla %99.9 kesintisiz yayın garantisi veriyoruz. 10 Mbps internet bağlantısı yeterlidir.' },
  { q: 'Ödeme sonrası ne zaman başlıyor?', a: 'WhatsApp üzerinden ödeme onaylandıktan hemen sonra hesabınız aktif edilir, beklemenize gerek yoktur.' },
  { q: 'Kaç cihazda kullanabilirim?', a: 'Standart paketlerde 1 bağlantı, Süresiz pakette 2 bağlantı dahildir. Ek bağlantı için WhatsApp\'tan iletişime geçebilirsiniz.' },
  { q: 'IPTV için ne kadar internet hızı gerekir?', a: 'Full HD yayın için minimum 10 Mbps, 4K yayın için minimum 25 Mbps önerilir. Stabil bir bağlantı hız kadar önemlidir.' },
];

// ─── Schema Markup ─────────────────────────────────────────────────────────────
const faqSchema = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};
const productSchema = {
  '@context': 'https://schema.org', '@type': 'Product',
  name: 'Galya IPTV Paketleri',
  image: 'https://galyaiptv.com.tr/og-image.jpg',
  description: 'Donmayan Premium IPTV hizmeti. 85.000+ kanal, 4K yayın kalitesi. Avrupa sunucuları ile kesintisiz yayın.',
  brand: { '@type': 'Brand', name: 'Galya IPTV' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '1243', bestRating: '5' },
  offers: {
    '@type': 'AggregateOffer', lowPrice: '500', highPrice: '6900',
    priceCurrency: 'TRY', availability: 'https://schema.org/InStock',
    offerCount: '6', url: 'https://galyaiptv.com.tr/#paketler',
  },
};
const organizationSchema = {
  '@context': 'https://schema.org', '@type': 'Organization',
  name: 'Galya IPTV', url: 'https://galyaiptv.com.tr/',
  logo: 'https://galyaiptv.com.tr/logo.png',
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', url: 'https://wa.me/447441921660', availableLanguage: ['Turkish'] }],
};

type ModalStep = 1 | 1.5 | 2 | 3 | 4 | 5 | 6;

// ─── Cihaz ve kurulum rehberi verileri ───────────────────────────────────────
const DEVICES = [
  { id: 'smarttv', label: 'Smart TV', sub: 'Samsung, LG, Vestel...', icon: '📺' },
  { id: 'mobile', label: 'Telefon / Tablet', sub: 'Android, iPhone...', icon: '📱' },
  { id: 'tvbox', label: 'TV Box / MAG', sub: 'Android Box, MAG...', icon: '📦' },
  { id: 'pc', label: 'Bilgisayar', sub: 'Windows, Mac...', icon: '💻' },
] as const;
type DeviceId = typeof DEVICES[number]['id'];

const PURPOSES = [
  { id: 'sports', label: 'Spor', sub: 'beIN Sports, S Sport, Exxen...', icon: '⚽' },
  { id: 'movies', label: 'Film & Dizi', sub: 'Netflix, Disney+ içerikleri dahil', icon: '🎬' },
  { id: 'livetv', label: 'Canlı TV & Haberler', sub: 'Yerli ve yabancı kanallar', icon: '📡' },
  { id: 'foreign', label: 'Yurt Dışı Kanallar', sub: 'Almanya, Hollanda, İngiltere...', icon: '🌍' },
];

const INSTALL_GUIDES: Record<DeviceId, { app: string; steps: string[]; note?: string }> = {
  smarttv: {
    app: 'Hot IPTV Player',
    steps: [
      'Smart TV\'nizde uygulama mağazasını açın (Samsung Apps / LG Content Store).',
      '"Hot IPTV Player" uygulamasını arayın ve indirin.',
      'Uygulamayı açın — ekranda bir aktivasyon kodu göreceksiniz.',
      'Bilgisayar veya telefondan hot-iptv.net adresine gidip kodu girin.',
      'Aynı sayfada sunucu bilgilerini (kullanıcı adı & şifre) ekleyin.',
      'TV\'deki uygulamayı yenileyin — kanallar otomatik yüklenecektir.',
    ],
    note: 'Samsung TV\'niz Tizen işletim sistemi kullanıyorsa otomatik güncellemeyi kapatmanız önerilir.',
  },
  mobile: {
    app: 'IPTV Smarters Pro (Android) · GSE Smart IPTV (iPhone)',
    steps: [
      'Android: Play Store\'dan "IPTV Smarters Pro" indirin.',
      'iPhone: App Store\'dan "GSE Smart IPTV" indirin.',
      'Uygulamayı açın ve "Xtream Codes API ile Giriş" seçeneğini seçin.',
      'Sunucu alanına: http://pro4kiptv.xyz:2086 yazın.',
      'Kullanıcı adı ve şifrenizi girin, "Kullanıcı Ekle" butonuna basın.',
      'Uygulama kanal listenizi otomatik olarak yükleyecektir.',
    ],
    note: 'iPhone\'dan TV\'ye AirPlay veya HDMI adaptörü ile büyük ekranda da izleyebilirsiniz.',
  },
  tvbox: {
    app: '9Xtream',
    steps: [
      'Android Box\'ınızda Play Store\'u açın ve "9Xtream" uygulamasını indirin.',
      'MAG cihazlarda: Menü → Media → Xtream Codes Ayarları yolunu izleyin.',
      'Uygulamayı açın ve "Add Xtream Codes API" seçeneğine tıklayın.',
      'Sunucu: http://pro4kiptv.xyz:2086 girin.',
      'Kullanıcı adı ve şifrenizi giriş ekranına yazın.',
      '"Ekle" butonuna basın — canlı TV, film ve diziler yüklenecektir.',
    ],
    note: 'TV Box\'ınız Play Store\'suz geliyorsa APK olarak da kurabilirsiniz. WhatsApp üzerinden yardım alabilirsiniz.',
  },
  pc: {
    app: 'Smarters Player Pro',
    steps: [
      'Windows veya Mac için smarters.live adresinden "Smarters Player Pro" indirin.',
      'Uygulamayı kurun ve açın.',
      '"Login with Xtream Codes API" seçeneğini seçin.',
      'Sunucu: http://pro4kiptv.xyz:2086 girin.',
      'Kullanıcı adı ve şifrenizi girin, "Add User" butonuna tıklayın.',
      'Kanal listeniz yüklenecek — Live TV, Film ve Dizi bölümlerinden izleyebilirsiniz.',
    ],
    note: 'Alternatif olarak VLC Media Player\'da da kullanabilirsiniz: Ortam → Ağ Akışı Aç → M3U linkini yapıştırın.',
  },
};

const LS_KEY = 'galya_modal_progress';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastMsg { id: number; message: string; type: ToastType }

function ToastContainer({ toasts, onRemove }: { toasts: ToastMsg[]; onRemove: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col-reverse gap-2">
      {toasts.map((t) => (
        <div key={t.id} onClick={() => onRemove(t.id)}
          className={`pointer-events-auto flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md transition-all ${t.type === 'success' ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300' : t.type === 'error' ? 'border-red-500/40 bg-red-950/80 text-red-300' : t.type === 'warning' ? 'border-amber-500/40 bg-amber-950/80 text-amber-300' : 'border-[#1e3a5f] bg-[#111827]/95 text-[#818cf8]'}`}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const newVal = value.split('');
    newVal[index] = digit;
    const joined = newVal.join('').padEnd(6, '').slice(0, 6).replace(/\s/g, '');
    onChange(joined.replace(/ /g, ''));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => { if (e.key === 'Backspace' && !value[index] && index > 0) inputs.current[index - 1]?.focus(); };
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); setTimeout(() => inputs.current[Math.min(pasted.length, 5)]?.focus(), 0); }
    e.preventDefault();
  };
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={(el) => { inputs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} onPaste={handlePaste}
          className={`h-12 w-10 rounded-xl border bg-[#111827] text-center font-mono text-xl font-bold text-white outline-none transition-all ${value[i] ? 'border-[#6366f1]/60 bg-[#1e1b4b]/40' : 'border-[#1e3a5f] focus:border-[#6366f1]/40'}`} />
      ))}
    </div>
  );
}

function Stars({ count = 5 }: { count?: number }) {
  return <span className="flex gap-0.5">{Array.from({ length: count }).map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}</span>;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => { navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  return (
    <button onClick={handle} className={`ml-2 rounded-md border px-2 py-0.5 text-xs transition-all ${copied ? 'border-emerald-500/60 text-emerald-400' : 'border-[#1e3a5f] text-[#818cf8] hover:border-[#6366f1]/50 hover:text-[#a5b4fc]'}`}>
      {copied ? '✓ Kopyalandı' : 'Kopyala'}
    </button>
  );
}

function Countdown({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const total = 3 * 60 * 60 * 1000;
    const calc = () => Math.max(0, total - (Date.now() - startedAt));
    setRemaining(calc());
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const h = Math.floor(remaining / 3600000), m = Math.floor((remaining % 3600000) / 60000), s = Math.floor((remaining % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1.5">
      {[{ val: pad(h), label: 'sa' }, { val: pad(m), label: 'dk' }, { val: pad(s), label: 'sn' }].map((block, i) => (
        <span key={block.label} className="flex items-center gap-1">
          {i > 0 && <span className="mb-2 text-xs font-bold text-emerald-500">:</span>}
          <span className="flex flex-col items-center">
            <span className="font-mono text-base font-bold leading-none text-emerald-400">{block.val}</span>
            <span className="text-[9px] uppercase tracking-wider text-emerald-600">{block.label}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

const STEP_LABELS = ['Cihaz', 'E-posta', 'Doğrula', 'Test', 'Kurulum'];
function Stepper({ step }: { step: ModalStep }) {
  const active = step === 1 ? 1 : step === 1.5 ? 1 : step === 6 ? 5 : Math.min(step as number, 5);
  return (
    <div className="mb-5 flex items-center justify-center gap-1">
      {STEP_LABELS.map((label, i) => {
        const idx = i + 1; const done = active > idx; const current = active === idx;
        return (
          <span key={label} className="flex items-center gap-1">
            <span className="flex flex-col items-center gap-0.5">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${done ? 'bg-[#6366f1] text-white' : current ? 'border-2 border-[#6366f1] text-[#818cf8]' : 'border border-[#1e3a5f] text-[#4b5563]'}`}>{done ? '✓' : idx}</span>
              <span className={`text-[9px] ${current ? 'text-[#818cf8]' : done ? 'text-[#6366f1]' : 'text-[#4b5563]'}`}>{label}</span>
            </span>
            {i < STEP_LABELS.length - 1 && <span className={`mb-4 h-px w-8 ${done ? 'bg-[#6366f1]' : 'bg-[#1e3a5f]'}`} />}
          </span>
        );
      })}
    </div>
  );
}

function CreatingProgress() {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const statuses = ['Yayın bağlantısı kuruluyor...', 'Yayın hazırlanıyor...', 'Test hesabınız oluşturuluyor...', 'Son kontroller yapılıyor...'];
  useEffect(() => {
    const duration = 35000, interval = 200, stepVal = 90 / (duration / interval);
    const timer = setInterval(() => setProgress((prev) => { const next = prev + stepVal; return next >= 90 ? 90 : next; }), interval);
    const statusTimer = setInterval(() => setStatusIndex((prev) => (prev + 1 < statuses.length ? prev + 1 : prev)), 8000);
    return () => { clearInterval(timer); clearInterval(statusTimer); };
  }, []);
  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#818cf8]">{statuses[statusIndex]}</span>
        <span className="font-mono text-[#818cf8]">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e3a5f]/50">
        <div className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#4f46e5] transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-center text-[11px] text-[#6b7280]">Bu işlem 30–40 saniye sürebilir, lütfen bekleyin.</p>
    </div>
  );
}

// ─── Ziyaretçi sayacı animasyonu ──────────────────────────────────────────────
function VisitorCount() {
  const [count, setCount] = useState(47);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => { const delta = Math.floor(Math.random() * 5) - 2; return Math.max(30, Math.min(80, c + delta)); });
    }, 8000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-semibold text-white">{count}+</span>;
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
// ── Countdown banner bileşeni ─────────────────────────────────────────────
function TrialBanner({ active, startedAt }: { active: boolean; startedAt: number }) {
  const TOTAL = 3 * 60 * 60 * 1000;
  const [rem, setRem] = useState(0);
  useEffect(() => {
    const calc = () => Math.max(0, TOTAL - (Date.now() - startedAt));
    setRem(calc());
    const id = setInterval(() => setRem(calc()), 1000);
    return () => clearInterval(id);
  }, [startedAt, TOTAL]);
  const h = Math.floor(rem / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const pad = (n: number) => String(n).padStart(2, '0');

  if (!active) {
    return (
      <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-3 py-2 text-center sm:px-4 sm:py-2.5">
        <p className="text-xs font-semibold text-amber-400 sm:text-sm">
          ⌛ Test süreniz sona erdi —{' '}
          <a href="/abonelik" className="underline hover:text-amber-300">Şimdi Abone Olun →</a>
        </p>
      </div>
    );
  }
  return (
    <div className="w-full bg-emerald-500/10 border-b border-emerald-500/20 px-3 py-2 text-center sm:px-4 sm:py-2.5">
      <p className="text-xs font-semibold text-emerald-400 sm:text-sm">
        ✅ Test süreniz devam ediyor —{' '}
        <span className="font-mono text-white">{pad(h)} saat {pad(m)} dakika</span> kaldı ·{' '}
        <a href="/abonelik" className="underline hover:text-emerald-300">Şimdi Abone Olun →</a>
      </p>
    </div>
  );
}

function HomePageInner() {
  const { data: session, status } = useSession();
  const prices = usePrices();
  const isLoggedIn = status === 'authenticated';
  const authLoading = status === 'loading';
  const [globalTrialCreds, setGlobalTrialCreds] = useState<{ username: string; password: string; startedAt: number } | null>(null);
  const [trialCreating, setTrialCreating] = useState(false);
  const [trialCreatingProgress, setTrialCreatingProgress] = useState(0);
  const TRIAL_TOTAL = 3 * 60 * 60 * 1000;
  const trialActive = globalTrialCreds !== null && (Date.now() - globalTrialCreds.startedAt) < TRIAL_TOTAL;
  const trialExpired = globalTrialCreds !== null && (Date.now() - globalTrialCreds.startedAt) >= TRIAL_TOTAL;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [step, setStep] = useState<ModalStep>(1);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<DeviceId | ''>('');
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [alreadyUsedMsg, setAlreadyUsedMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRecovery, setIsRecovery] = useState(false);
  const [trialCredentials, setTrialCredentials] = useState<{ username: string; password: string; startedAt: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const [recommendedPkg, setRecommendedPkg] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  // Progress bar için interval ref
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Giriş yapan kullanıcı için test bilgilerini yükle / oluştur
  useEffect(() => {
    if (!isLoggedIn || !session?.user?.email) return;
    const userEmail = session.user.email;

    // localStorage'daki veriyi kontrol et — ama önce email eşleşiyor mu doğrula
    try {
      const raw = localStorage.getItem('galya_trial_creds');
      if (raw) {
        const p = JSON.parse(raw);
        // Email eşleşiyorsa kullan, eşleşmiyorsa temizle
        if (p.username && p.email === userEmail) {
          setGlobalTrialCreds(p);
          // Yine de Redis'ten doğrula (arka planda)
          fetch('/api/test-talep', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_trial', email: userEmail }),
          })
            .then(r => r.json())
            .then(data => {
              if (data.success) {
                const cr = { email: userEmail, username: data.username, password: data.password, startedAt: data.startedAt };
                setGlobalTrialCreds(cr);
                try { localStorage.setItem('galya_trial_creds', JSON.stringify(cr)); } catch { /* */ }
              }
            })
            .catch(() => { /* */ });
          return;
        } else {
          // Farklı hesabın verisi — temizle
          localStorage.removeItem('galya_trial_creds');
        }
      }
    } catch { /* */ }

    // localStorage'da bu hesaba ait veri yoksa → yeni test oluştur, progress göster
    setTrialCreating(true);
    setTrialCreatingProgress(0);

    // Progress bar animasyonu (35 saniyede %90'a kadar)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setTrialCreatingProgress(prev => {
        if (prev >= 90) { clearInterval(progressIntervalRef.current!); return 90; }
        return prev + (90 / (35000 / 300));
      });
    }, 300);

    fetch('/api/test-talep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_direct', email: userEmail }),
    })
      .then(r => r.json())
      .then(data => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (data.success) {
          setTrialCreatingProgress(100);
          const cr = { email: userEmail, username: data.username, password: data.password, startedAt: data.startedAt || Date.now() };
          setGlobalTrialCreds(cr);
          try { localStorage.setItem('galya_trial_creds', JSON.stringify(cr)); } catch { /* */ }
          // Kısa bekle sonra profil sayfasına yönlendir
          setTimeout(() => {
            setTrialCreating(false);
            window.location.href = '/profil';
          }, 1200);
        } else {
          setTrialCreating(false);
          setTrialCreatingProgress(0);
        }
      })
      .catch(() => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setTrialCreating(false);
        setTrialCreatingProgress(0);
      });

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, session?.user?.email]);

  const [selectedDuration, setSelectedDuration] = useState<DurationKey>('6ay');
  const toastIdRef = useRef(0);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => { if (resendCooldown <= 0) return; const id = setInterval(() => setResendCooldown((c) => Math.max(c - 1, 0)), 1000); return () => clearInterval(id); }, [resendCooldown]);
  useEffect(() => { if (step === 2) setTimeout(() => emailInputRef.current?.focus(), 100); }, [step]);
  useEffect(() => { if (selectedDevice && selectedPurposes.length > 0) setRecommendedPkg(getRecommendedPackage(selectedDevice, selectedPurposes)); }, [selectedDevice, selectedPurposes]);


  const handleOpenModal = (pkg?: string) => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) { const parsed = JSON.parse(saved); if (parsed.device) setSelectedDevice(parsed.device); if (parsed.purposes) setSelectedPurposes(parsed.purposes); if (parsed.email) setEmail(parsed.email); }
      else { setSelectedDevice(''); setSelectedPurposes([]); setEmail(''); }
    } catch { setSelectedDevice(''); setSelectedPurposes([]); setEmail(''); }
    setIsModalOpen(true); setStep(1); setSelectedPackage(pkg || '');
    setOtp(''); setOtpToken(''); setStatusMsg(''); setAlreadyUsedMsg('');
    setResendCooldown(0); setIsRecovery(false); setTrialCredentials(null); setIsCreating(false);
  };

  const handleCloseModal = () => {
    if (step !== 4) { try { localStorage.setItem(LS_KEY, JSON.stringify({ device: selectedDevice, purposes: selectedPurposes, email })); } catch { } }
    else { try { localStorage.removeItem(LS_KEY); } catch { } }
    setIsModalOpen(false); setStep(1); setSelectedPackage(''); setSelectedDevice(''); setSelectedPurposes([]);
    setEmail(''); setOtp(''); setOtpToken(''); setStatusMsg(''); setAlreadyUsedMsg('');
    setLoading(false); setResendCooldown(0); setIsRecovery(false); setTrialCredentials(null); setIsCreating(false);
  };

  const handleSendOtp = async (recoveryMode = false) => {
    if (!email) return addToast('Lütfen e-posta adresinizi girin.', 'warning');
    setLoading(true); setStatusMsg('');
    try {
      const res = await fetch('/api/test-talep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_otp', email, selectedPackage }) });
      const data = await res.json();
      if (data.alreadyUsed) { if (recoveryMode) { setIsRecovery(true); } else { setAlreadyUsedMsg(data.error); setStep(6 as ModalStep); return; } }
      if (data.cooldown) { setResendCooldown(data.retryAfter || 60); setStatusMsg(data.error); return; }
      if (data.success) { setOtpToken(data.token); setIsRecovery(recoveryMode); setStep(3); setResendCooldown(60); addToast('Doğrulama kodu gönderildi.', 'success'); }
      else { addToast(data.error || 'Kod gönderilemedi.', 'error'); }
    } catch { addToast('Sunucuya bağlanılamadı. WhatsApp üzerinden destek alabilirsiniz.', 'error'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) return addToast('Lütfen 6 haneli doğrulama kodunu girin.', 'warning');
    setLoading(true); if (!isRecovery) setIsCreating(true); setStatusMsg(isRecovery ? 'Bilgileriniz getiriliyor...' : '');
    try {
      const action = isRecovery ? 'recover' : 'verify';
      const res = await fetch('/api/test-talep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, email, otp, token: otpToken }) });
      const data = await res.json();
      if (data.alreadyUsed) { setAlreadyUsedMsg(data.error); setStep(6 as ModalStep); setStatusMsg(''); setIsCreating(false); return; }
      if (data.success) {
        const creds = { username: data.username, password: data.password, startedAt: Date.now() };
        setTrialCredentials(creds);
        // Kurulum rehberi sayfasında okunabilmesi için ayrıca kaydet
        try { localStorage.setItem('galya_trial_creds', JSON.stringify(creds)); } catch { }
        setStep(4); setStatusMsg(''); setIsCreating(false); addToast('Test hesabınız hazır!', 'success'); }
      else { addToast(data.error || 'Kod hatalı. Lütfen tekrar deneyin.', 'error'); setStatusMsg(''); setIsCreating(false); }
    } catch { addToast('Bir hata oluştu. Tekrar deneyin.', 'error'); setStatusMsg(''); setIsCreating(false); }
    finally { setLoading(false); }
  };

  const m3uLink = trialCredentials ? `http://pro4kiptv.xyz:2086/get.php?username=${trialCredentials.username}&password=${trialCredentials.password}&type=m3u&output=ts` : '';
  const WaButton = ({ label = '💬 WhatsApp ile Satın Al' }: { label?: string }) => (
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 text-sm font-bold text-white transition-colors hover:bg-[#1ebe5d]">{label}</a>
  );

  const smartAction = () => {
    if (!isLoggedIn) { openAuth(); return; }
    if (trialActive) { window.location.href = '/profil'; return; }
    if (trialExpired) { window.location.href = '/abonelik'; return; }
    // logged in but no trial yet (creating) — do nothing
  };

  const openAuth = (mode: 'login' | 'register' = 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />


      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#07111f]/90 backdrop-blur-md">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo — görseldeki gibi solda */}
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Galya IPTV"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const fb = e.currentTarget.nextElementSibling as HTMLElement;
                if (fb) fb.style.display = 'flex';
              }}
            />
            <span className="hidden items-center gap-1 text-lg font-bold tracking-tight text-white">
              Galya <span className="text-[#3b82f6]">IPTV</span>
            </span>
          </Link>

          {/* Orta nav — görseldeki pill şeklinde nav kutusu */}
          <div className="hidden items-center md:flex">
            <div className="flex items-center gap-1 rounded-2xl border border-[#1e2d42] bg-[#0d1a2a] px-2 py-1.5">
              {[
                { href: '/#paketler',    label: 'Paketler'          },
              { href: '/#ozellikler',  label: 'Özellikler'        },
              { href: '/#platformlar', label: 'Platformlar'       },
              { href: '/#yorumlar',    label: 'Yorumlar'          },
              { href: '/#sss',         label: 'SSS'               },
              { href: '/kurulum-rehberi', label: 'Kurulum Rehberi'},
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-4 py-1.5 text-sm font-medium text-[#8b9ab3] transition-colors hover:bg-[#162035] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sağ: Session durumuna göre değişir */}
          <div className="hidden items-center gap-3 md:flex">
            {authLoading ? (
              <div className="h-8 w-32 animate-pulse rounded-xl bg-[#1e2d42]" />
            ) : isLoggedIn ? (
              <>
                <Link href="/profil" className="flex items-center gap-2 text-sm font-medium text-[#8b9ab3] transition-colors hover:text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-bold text-[#3b82f6]">
                    {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                  Profilim
                </Link>
                {trialActive ? (
                  <Link href="/profil" className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700">
                    ✅ Test Aktif
                  </Link>
                ) : trialExpired ? (
                  <Link href="/abonelik" className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600">
                    👑 Premium&apos;a Geç
                  </Link>
                ) : (
                  <Link href="/profil" className="rounded-xl bg-[#3b82f6] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-[#3b82f6]/30 transition-all hover:bg-[#2563eb]">
                    ⚡ Testi Başlat
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/giris" className="text-sm font-medium text-[#8b9ab3] transition-colors hover:text-white">
                  Giriş Yap
                </Link>
                <Link href="/kayit" className="rounded-xl bg-[#3b82f6] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-[#3b82f6]/30 transition-all hover:bg-[#2563eb]">
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          {/* Mobil hamburger */}
          <button className="flex flex-col gap-1.5 p-2 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menüyü aç">
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-[#1e3a5f] bg-[#0d1117] px-4 pb-4 md:hidden">
            <div className="flex flex-col gap-1 pt-3 text-sm">
              {[{ href: '/#paketler', label: 'Paketler' }, { href: '/#ozellikler', label: 'Özellikler' }, { href: '/#platformlar', label: 'Platformlar' }, { href: '/#yorumlar', label: 'Yorumlar' }, { href: '/#sss', label: 'S.S.S' }, { href: '/kurulum-rehberi', label: 'Kurulum Rehberi' }].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-[#9ca3af] transition-colors hover:bg-[#1e3a5f]/30 hover:text-white">{item.label}</Link>
              ))}
              <button onClick={() => { setMobileMenuOpen(false); openAuth(); }} className="mt-2 rounded-xl bg-[#3b82f6] py-3 text-sm font-bold text-white">Kayıt Ol</button>
            </div>
          </div>
        )}
      </header>

      <main className="bg-[#07111f] text-white">

        {/* ── Trial countdown banner ─────────────────────────────────────── */}
        {isLoggedIn && (trialActive || trialExpired) && (
          <TrialBanner active={trialActive} startedAt={globalTrialCreds?.startedAt ?? 0} />
        )}

        <section className="relative overflow-hidden">
          {/* Arka plan glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-0 top-0 h-[700px] w-[600px] rounded-full bg-[#1e3a5f]/20 blur-3xl" />
          </div>

          <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 pb-10 pt-8 sm:px-6 sm:pb-16 sm:pt-14 lg:flex-row lg:items-center lg:gap-0">

            {/* Sol: metin içeriği */}
            <div className="w-full lg:w-1/2 lg:pr-10">
              {/* Ziyaretçi sayacı badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1e2d42] bg-[#0d1a2a] px-3 py-1.5 text-xs text-[#9ca3af] sm:px-4 sm:py-2 sm:text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Şu anda <VisitorCount /> kişi satın alma sayfasında
              </div>

              {/* Ana başlık */}
              <h1 className="mb-5 text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                65.000+ İçerikli<br />
                <span className="text-[#3b82f6]">Premium IPTV</span>
              </h1>

              {/* Alt metin */}
              <p className="mb-6 max-w-lg text-base leading-relaxed text-[#8b9ab3]">
                Avrupa local sunucularla kesintisiz yayın. 65.000+ içerik, tüm
                cihazlarda çalışır.{' '}
                <strong className="text-white">3 Saat Ücretsiz Dene — Kurulum 5 dakika.</strong>
              </p>

              {/* Özellik rozetleri — görseldeki mavi bordered pill'ler */}
              <div className="mb-6 flex flex-wrap gap-2">
                {['Kesintisiz Yayın', '4K HDR', 'VPN Gerekmez', 'Smart TV Direkt Çalışır'].map((b) => (
                  <span key={b} className="flex items-center gap-1.5 rounded-full border border-[#1e3a5f] bg-[#0d1a2a] px-3.5 py-1.5 text-sm font-medium text-[#9ca3af]">
                    <span className="text-[#3b82f6] font-bold">✓</span> {b}
                  </span>
                ))}
              </div>

              {/* CTA butonları — session durumuna göre değişir */}
              <div className="flex flex-col gap-3 xs:flex-row sm:flex-row">
                {!authLoading && isLoggedIn && trialActive ? (
                  // Test aktif
                  <Link href="/profil"
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-emerald-600/30 transition-all hover:bg-emerald-700 hover:scale-[1.02]">
                    ✅ Testiniz Aktif — Profil →
                  </Link>
                ) : !authLoading && isLoggedIn && trialExpired ? (
                  // Test bitti
                  <Link href="/abonelik"
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-amber-500/30 transition-all hover:bg-amber-600 hover:scale-[1.02]">
                    👑 Premium&apos;a Geç →
                  </Link>
                ) : authLoading ? (
                  // Yükleniyor
                  <div className="h-14 w-48 animate-pulse rounded-xl bg-[#1e2d42]" />
                ) : (
                  // Giriş yok
                  <button onClick={() => openAuth()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#3b82f6] px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-[#3b82f6]/30 transition-all hover:bg-[#2563eb] hover:scale-[1.02]">
                    ⚡ Ücretsiz Dene →
                  </button>
                )}
                <Link href="/#paketler"
                  className="flex items-center justify-center rounded-xl border border-[#1e2d42] bg-[#0d1a2a] px-7 py-3.5 text-base font-semibold text-white transition-all hover:border-[#3b82f6]/40 hover:bg-[#162035]">
                  Paketleri Gör
                </Link>
              </div>
            </div>

            {/* Sağ: mockup görseli — mobilde gizli */}
            <div className="relative hidden lg:block w-full lg:w-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/platform-mockup.png"
                alt="Galya IPTV Uygulama Ekranı"
                className="w-full max-w-2xl rounded-2xl object-contain drop-shadow-2xl mx-auto lg:ml-auto lg:mr-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const ph = e.currentTarget.nextElementSibling as HTMLElement;
                  if (ph) ph.style.display = 'flex';
                }}
              />
              {/* Placeholder */}
              <div className="hidden w-full aspect-[4/3] items-center justify-center rounded-2xl border-2 border-dashed border-[#1e3a5f] bg-[#0d1a2a] text-center p-8">
                <div>
                  <div className="mb-3 text-5xl opacity-20">🖥️</div>
                  <p className="text-sm font-semibold text-[#374151]">platform-mockup.png</p>
                  <p className="mt-1 text-xs text-[#1f2937]">/public/ klasörüne yükle</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ─── Güven rozetleri şeridi ──────────────────────────────────────────── */}
        <div className="border-y border-[#1e2d42] bg-[#0a1525] px-6 py-4">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10">
            {[{ icon: '🔒', label: 'SSL Güvenli' }, { icon: '💬', label: 'WhatsApp Destek' }, { icon: '🆓', label: '3 Saat Ücretsiz Test' }, { icon: '⚡', label: 'Anında Kurulum' }, { icon: '🌍', label: '40+ Ülke Kanalı' }, { icon: '🎬', label: '4K HDR Yayın' }].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs text-[#4b5a6e]">
                <span className="text-base">{b.icon}</span><span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── PAKETLER ────────────────────────────────────────────────────────── */}
        <section id="paketler" className="px-4 py-12 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl px-0">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">Abonelik Paketleri</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Sizin İçin Doğru Paket</h2>
              <p className="mt-3 text-sm text-[#9ca3af]">Süreye göre seçin · Uzun süre seç, daha fazla tasarruf et</p>
            </div>

            {/* ── Süre Seçici ──────────────────────────────────────────────────── */}
            <div className="mb-10 flex justify-center">
              <div className="inline-flex rounded-2xl border border-[#1e3a5f] bg-[#0d1117] p-1.5 gap-1">
                {DURATIONS.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDuration(d.key)}
                    className="relative flex flex-col items-center"
                  >
                    {/* İndirim rozeti */}
                    {d.badge && (
                      <span className={`absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${d.discount === 20 ? 'bg-emerald-500' : 'bg-[#22c55e]'}`}>
                        {d.badge}
                      </span>
                    )}
                    <span className={`rounded-xl px-8 py-3 text-sm font-semibold transition-all ${
                      selectedDuration === d.key
                        ? 'bg-[#3b82f6] text-white shadow-lg shadow-[#3b82f6]/30'
                        : 'text-[#6b7280] hover:text-white'
                    }`}>
                      {d.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Paket Kartları ──────────────────────────────────────────────── */}
            <div className="grid gap-5 md:grid-cols-3 items-start">
              {categoryPackages.map((pkg) => {
                const dur         = DURATIONS.find(d => d.key === selectedDuration)!;
                // prices key mapping: 'spor'→'sports', 'max'→'max', 'cinema'→'cinema'
                const priceKey = pkg.id === 'spor' ? 'sports' : pkg.id;
                const liveBasePrice = prices[priceKey] ?? pkg.basePrice;
                const totalPrice  = calcTotalPrice(liveBasePrice, dur.months, dur.discount);
                const monthlyPrice = totalPrice / dur.months;
                const originalTotal = liveBasePrice * dur.months;
                const waText = `${pkg.waMsg} (${dur.label} paket, ₺${formatTL(totalPrice)})`;

                return (
                  <div key={pkg.id} className={`relative flex flex-col rounded-2xl border transition-all ${
                    pkg.popular
                      ? 'border-[#3b82f6]/80 bg-[#0c1628] shadow-2xl shadow-[#3b82f6]/20'
                      : 'border-[#1e2d42] bg-[#0a1020] hover:border-[#3b82f6]/30'
                  }`} style={{ padding: '28px 24px 24px' }}>

                    {/* EN POPÜLER rozeti */}
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#3b82f6] px-5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg">
                        EN POPÜLER
                      </div>
                    )}

                    {/* ── LOGO ── */}
                    <div className="mb-4 flex items-center justify-center" style={{ height: '96px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pkg.logo}
                        alt={pkg.logoAlt}
                        style={{ width: '100%', maxWidth: '260px', height: '96px', objectFit: 'contain' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          const fb = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                      {/* Fallback: logo yokken */}
                      <div className="hidden w-full h-24 items-center justify-center">
                        <span className="text-2xl font-extrabold tracking-tight text-white">{pkg.name}</span>
                      </div>
                    </div>

                    {/* ── Açıklama ── */}
                    <p className="mb-4 text-center text-[13px] leading-relaxed text-[#8b9ab3]">{pkg.desc}</p>

                    {/* ── Fiyat bloğu — görseldeki düzen ── */}
                    <div className="mb-4 text-center">
                      {/* İndirim rozeti (sadece indirimli durumlarda) */}
                      {dur.discount > 0 && (
                        <div className="mb-2 flex justify-center">
                          <span className="rounded-full bg-[#166534] px-3 py-0.5 text-xs font-bold text-[#4ade80]">
                            %{dur.discount} İndirim
                          </span>
                        </div>
                      )}

                      {/* Üstü çizili orijinal + aylık — tek satır, küçük */}
                      {dur.discount > 0 && (
                        <p className="mb-1 text-[12px] text-[#4b5563]">
                          <span className="line-through">₺{formatTL(originalTotal)}</span>
                          <span className="ml-2 line-through text-[#4b5563]">(₺{formatTL(pkg.basePrice)}/Ay)</span>
                        </p>
                      )}

                      {/* Büyük toplam + aylık yanında */}
                      <AnimatedPrice
                        target={totalPrice}
                        monthly={monthlyPrice}
                        popular={pkg.popular}
                      />
                    </div>

                    {/* ── Ayırıcı ── */}
                    <div className="mb-4 h-px bg-[#1a2d44]" />

                    {/* ── Özellikler ── */}
                    <ul className="mb-5 space-y-2">
                      {pkg.features.map((f) => (
                        <li key={f.text} className="flex items-center gap-2.5 text-[13px]">
                          <svg className="h-[18px] w-[18px] shrink-0 text-[#3b82f6]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                          </svg>
                          <span className={f.bold ? 'font-bold text-white' : 'text-[#9ca3af]'}>{f.text}</span>
                        </li>
                      ))}
                    </ul>

                    {/* ── CTA Butonu — Ödeme sayfasına yönlendir ── */}
                    <Link
                      href={`/odeme?paket=${encodeURIComponent(pkg.name)}&sure=${encodeURIComponent(dur.label)}&toplam=${totalPrice.toFixed(2)}&orijinal=${originalTotal.toFixed(2)}&indirim=${dur.discount}`}
                      className={`flex w-full items-center justify-center rounded-xl py-3.5 text-[15px] font-bold transition-all ${
                        pkg.popular
                          ? 'bg-[#3b82f6] text-white shadow-lg shadow-[#3b82f6]/30 hover:bg-[#2563eb]'
                          : 'border border-[#243448] bg-[#111c2d] text-white hover:border-[#3b82f6]/50 hover:bg-[#162035]'
                      }`}
                    >
                      {pkg.ctaLabel}
                    </Link>
                    {/* WhatsApp alternatif */}
                    <a
                      href={`${WHATSAPP_BASE}?text=${encodeURIComponent(waText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#1e2d42] py-2.5 text-xs font-medium text-[#25d366] transition-all hover:border-[#25d366]/30 hover:bg-[#25d366]/5"
                    >
                      💬 WhatsApp ile Satın Al
                    </a>
                  </div>
                );
              })}
            </div>

            <p className="mt-5 text-center text-xs text-[#374151]">
              * Paket fiyatları seçilen cihaz sayısı ve bölgeye göre değişiklik gösterebilir.
            </p>
          </div>
        </section>

        {/* ─── İÇERİK KAPSAMı ──────────────────────────────────────────────────── */}
        <section id="ozellikler" className="border-t border-[#1e3a5f] px-6 py-20">
          <div className="mx-auto max-w-5xl px-0">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">Neden Galya IPTV?</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Her Şey Tek Pakette</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Kart 1: Tek Abonelik */}
              <div className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-6 transition-all hover:border-[#3730a3]">
                <div className="mb-4 text-3xl">🌐</div>
                <h3 className="mb-2 text-lg font-bold text-white">Her Şey Tek Yerde</h3>
                <p className="mb-4 text-sm leading-relaxed text-[#9ca3af]">Netflix dizileri, beIN Sports maçları, güncel filmler, 40+ ülkeden canlı TV — tek üyelikle.</p>
                <ul className="space-y-1.5 text-xs text-[#6b7280]">
                  {['Türkiye, Almanya, İngiltere kanalları', 'Netflix & Prime içerik arşivi', 'Yeni çıkan filmler', 'Canlı haber kanalları'].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-[#6366f1]">›</span>{f}</li>
                  ))}
                </ul>
              </div>

              {/* Kart 2: VPN Gerekmez */}
              <div className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-6 transition-all hover:border-[#3730a3]">
                <div className="mb-4 text-3xl">🛡️</div>
                <h3 className="mb-2 text-lg font-bold text-white">VPN Gerekmez</h3>
                <p className="mb-4 text-sm leading-relaxed text-[#9ca3af]">Yurt dışındaysanız da Türkçe kanalları, yerli sporu ve yerel yayınları doğrudan izleyin.</p>
                <ul className="space-y-1.5 text-xs text-[#6b7280]">
                  {["Almanya'dan TRT 1 izle", "Hollanda'dan Süper Lig maçı", "İngiltere'den beIN Sports", 'Anında bağlantı, hemen başlar'].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-[#6366f1]">›</span>{f}</li>
                  ))}
                </ul>
              </div>

              {/* Kart 3: 4K HDR */}
              <div className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-6 transition-all hover:border-[#3730a3]">
                <div className="mb-4 text-3xl">🖥️</div>
                <h3 className="mb-2 text-lg font-bold text-white">4K HDR Kalite</h3>
                <p className="mb-4 text-sm leading-relaxed text-[#9ca3af]">Büyük ekranda kristal netliğinde görüntü. Sinema kalitesi, evinizde.</p>
                <ul className="space-y-1.5 text-xs text-[#6b7280]">
                  {['4K Ultra HD & Full HD seçenekleri', 'HDR renk desteği', 'Düşük gecikme, akıcı yayın', '10 Mbps bağlantı yeterli'].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="text-[#6366f1]">›</span>{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button onClick={() => smartAction()} className="rounded-xl bg-[#1e1b4b] border border-[#3730a3] px-8 py-3.5 font-semibold text-[#818cf8] transition-all hover:bg-[#312e81] hover:text-white">
                ⚡ Ücretsiz Test İle Dene
              </button>
            </div>
          </div>
        </section>

        {/* ─── PLATFORMLAR ─────────────────────────────────────────────────────── */}
        <section id="platformlar" className="border-t border-[#1e3a5f] bg-[#0a0f1a] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">

              {/* Sol: Başlık + cihaz grid */}
              <div className="lg:w-[45%] shrink-0">
                <h2 className="mb-4 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl">
                  Anında Aç, <span className="text-[#3b82f6]">Her</span><br />
                  Ekranda <span className="text-[#3b82f6]">İzle</span>
                </h2>
                <p className="mb-8 text-sm leading-relaxed text-[#9ca3af] max-w-md">
                  Tek hesabınla televizyonda başla, telefonda devam et.
                  Kurulum gerektirmez, cihaz sınırı yok — nerede olursan
                  ol, aynı kalitede izlemeye devam et.
                </p>

                {/* Cihaz ikonu grid — 4 sütun, görseldeki gibi */}
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
                  {[
                    { icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <path d="M8 21h8M12 17v4"/>
                      </svg>
                    ), label: 'Smart TV' },
                    { icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <path d="M8 21h8M12 17v4"/><circle cx="19" cy="5" r="1.5" fill="currentColor"/>
                      </svg>
                    ), label: 'Android TV' },
                    { icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                        <path d="M8 12l2 2 4-4"/>
                      </svg>
                    ), label: 'Fire TV Stick' },
                    { icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <rect x="7" y="2" width="10" height="20" rx="2"/>
                        <circle cx="12" cy="18" r="1" fill="currentColor"/>
                      </svg>
                    ), label: 'iPhone' },
                    { icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <rect x="5" y="2" width="14" height="20" rx="2"/>
                        <circle cx="12" cy="18" r="1" fill="currentColor"/>
                      </svg>
                    ), label: 'Android' },
                    { icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <rect x="3" y="4" width="18" height="13" rx="1.5"/>
                        <path d="M9 21h6M12 17v4"/>
                      </svg>
                    ), label: 'iPad / Tablet' },
                    { icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <rect x="2" y="4" width="20" height="14" rx="1.5"/>
                        <path d="M2 18h20M8 22h8"/>
                      </svg>
                    ), label: 'Windows' },
                    { icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                        <rect x="2" y="4" width="20" height="14" rx="1.5"/>
                        <path d="M6 22h12M12 18v4"/>
                      </svg>
                    ), label: 'macOS' },
                  ].map((d) => (
                    <div key={d.label} className="flex flex-col items-center gap-2 rounded-xl border border-[#1e2a3a] bg-[#111827] px-3 py-4 transition-colors hover:border-[#3b82f6]/40">
                      <span className="text-[#9ca3af]">{d.icon}</span>
                      <span className="text-center text-xs font-medium text-[#9ca3af]">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sağ: Uygulama mockup görseli */}
              <div className="relative flex-1 flex items-center justify-center">
                {/* 
                  Kendi görselin: /public/platform-mockup.png
                  Bu dosyayı /public/ klasörüne yükle.
                */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/platform-mockup.png"
                  alt="Galya IPTV Uygulama Ekranı"
                  className="w-full max-w-xl rounded-2xl object-contain drop-shadow-2xl"
                  onError={(e) => {
                    // Görsel yokken placeholder göster
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    const ph = e.currentTarget.nextElementSibling as HTMLElement;
                    if (ph) ph.style.display = 'flex';
                  }}
                />
                {/* Placeholder — görsel eklenince otomatik gizlenir */}
                <div className="hidden w-full max-w-xl aspect-video items-center justify-center rounded-2xl border-2 border-dashed border-[#1e3a5f] bg-[#111827]/60 text-center p-8">
                  <div>
                    <div className="mb-3 text-4xl opacity-30">🖥️</div>
                    <p className="text-sm font-semibold text-[#4b5563]">platform-mockup.png</p>
                    <p className="mt-1 text-xs text-[#374151]">/public/ klasörüne yükle</p>
                  </div>
                </div>

                {/* "4K Kristal Netliğinde" overlay rozeti */}
                <div className="absolute right-4 top-4 rounded-xl border border-[#3b82f6]/40 bg-[#0d1525]/90 px-3 py-2 backdrop-blur-sm">
                  <span className="text-xs font-bold text-[#3b82f6]">4K Kristal Netliğinde</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── YORUMLAR ────────────────────────────────────────────────────────── */}
        <section id="yorumlar" className="border-t border-[#1e3a5f] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">Müşteri Yorumları</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Kullanıcılarımız Ne Diyor?</h2>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Stars count={5} />
                <span className="text-sm text-[#9ca3af]">10.200+ kullanıcı · Ortalama <strong className="text-white">4.9</strong>/5</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <div key={r.initials} className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-5 transition-all hover:border-[#3730a3]">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e1b4b] text-sm font-bold text-[#818cf8]">{r.initials}</div>
                      <div>
                        <div className="text-sm font-semibold text-white">{r.name}</div>
                        <div className="text-xs text-[#6b7280]">{r.city}</div>
                      </div>
                    </div>
                    <Stars count={r.stars} />
                  </div>
                  <p className="text-sm leading-relaxed text-[#9ca3af]">"{r.text}"</p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="mb-4 text-sm text-[#9ca3af]">Siz de denemek ister misiniz?</p>
              <button onClick={() => smartAction()} className="rounded-xl bg-[#6366f1] px-8 py-3.5 font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition-all hover:bg-[#4f46e5] hover:scale-[1.02]">
                Ücretsiz Test Al →
              </button>
            </div>
          </div>
        </section>

        {/* ─── SSS + GARANTİ ───────────────────────────────────────────────────── */}
        <section id="sss" className="border-t border-[#1e3a5f] bg-[#0d1117] px-6 py-20">
          <div className="mx-auto max-w-5xl px-0">
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">Sıkça Sorulan Sorular</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Aklınızdaki Sorular</h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* SSS */}
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={faq.q} className="rounded-xl border border-[#1e3a5f] bg-[#111827] overflow-hidden transition-colors hover:border-[#3730a3]">
                    <button className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span className="text-sm font-medium text-white">{faq.q}</span>
                      <span className={`shrink-0 text-[10px] text-[#6b7280] transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {openFaq === i && <p className="px-5 pb-4 text-sm leading-relaxed text-[#9ca3af]">{faq.a}</p>}
                  </div>
                ))}
              </div>

              {/* Galya Garantisi */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#6366f1]/40 bg-[#1e1b4b]/30 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">🛡️ Galya Garantisi</h3>
                  <div className="space-y-3">
                    {[
                      { icon: '✅', title: 'Sorun Çözme Garantisi', desc: 'Yaşadığınız her sorunda destek ekibimiz çözüm üretir.' },
                      { icon: '⚡', title: 'Anında Aktivasyon', desc: 'Ödeme onaylandıktan saniyeler içinde hesabınız aktif.' },
                      { icon: '📱', title: 'Tüm Cihazlar', desc: 'Smart TV, telefon, tablet, PC — her cihazda çalışır.' },
                      { icon: '🎧', title: '7/24 Türkçe Destek', desc: 'WhatsApp üzerinden her saat, 7 gün destek.' },
                    ].map((g) => (
                      <div key={g.title} className="flex items-start gap-3 rounded-xl border border-[#1e3a5f]/50 bg-[#111827]/60 p-3">
                        <span className="mt-0.5 text-lg">{g.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{g.title}</p>
                          <p className="text-xs text-[#9ca3af]">{g.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#1e3a5f] bg-[#111827] p-5 text-center">
                  <p className="mb-1 text-sm font-semibold text-white">10.200+ aktif kullanıcı Galya IPTV'yi tercih ediyor</p>
                  <p className="mb-4 text-xs text-[#6b7280]">Ücretsiz test ile başlayın, beğenirseniz satın alın</p>
                  <button onClick={() => smartAction()} className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5]">
                    ⚡ Ücretsiz Test Al
                  </button>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#1e3a5f] py-2.5 text-sm text-[#25d366] transition-colors hover:border-[#25d366]/40">
                    💬 WhatsApp&apos;a Yaz
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SON CTA ──────────────────────────────────────────────────────────── */}
        <section className="border-t border-[#1e3a5f] px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3730a3] bg-[#1e1b4b] px-4 py-1.5 text-xs text-[#818cf8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#818cf8] animate-pulse" />
              Hâlâ kararsız mısınız? Önce 3 saat ücretsiz deneyin.
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-4xl">Bugün Başlayın</h2>
            <p className="mb-2 text-sm text-[#9ca3af]">Ücretsiz test ile kaliteyi görün, sonra karar verin.</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#6b7280]">
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Sorun çözme garantisi</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> 5 dakika kurulum</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> 7/24 Türkçe destek</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Anında aktivasyon</span>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={() => smartAction()} className="rounded-xl bg-[#6366f1] px-10 py-4 font-semibold text-white shadow-xl shadow-[#6366f1]/25 transition-all hover:bg-[#4f46e5] hover:scale-[1.02]">
                ⚡ Ücretsiz Test Al
              </button>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-8 py-4 font-semibold text-white transition-all hover:bg-[#1ebe5d]">
                💬 WhatsApp ile İletişim
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e3a5f] bg-[#0d1117] px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl px-0">
          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <div>
              <p className="text-lg font-bold text-white">Galya <span className="text-[#818cf8]">IPTV</span></p>
              <p className="mt-1 text-xs text-[#6b7280]">Kesintisiz, kristal netliğinde yayın — her ekranda</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6b7280]">
              <span className="text-amber-400">★★★★★</span>
              <span className="font-semibold text-white">4.9</span>
              <span>· 1.243 değerlendirme</span>
              <span className="ml-2 rounded-md border border-[#1e3a5f] px-2 py-0.5">🔒 SSL Güvenli</span>
            </div>
          </div>
          <div className="mt-8 border-t border-[#1e3a5f] pt-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex flex-wrap justify-center gap-5 text-xs text-[#6b7280]">
              <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
              <Link href="/#platformlar" className="transition-colors hover:text-white">Desteklenen Cihazlar</Link>
              <Link href="/#sss" className="transition-colors hover:text-white">S.S.S</Link>
              <Link href="/kurulum-rehberi" className="transition-colors hover:text-white">Kurulum Rehberi</Link>
              <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
              <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
              <Link href="/blog/iptv-nedir" className="transition-colors hover:text-white">IPTV Nedir?</Link>
            </div>
            <p className="text-xs text-[#4b5563]">© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      {/* ─── Mobil Sticky CTA ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1e3a5f] bg-[#030712]/95 px-3 py-2 backdrop-blur-md md:hidden">
        <div className="flex gap-2">
          {isLoggedIn && trialActive ? (
            <Link href="/profil" className="flex flex-1 items-center justify-center rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white">✅ Testiniz Aktif</Link>
          ) : isLoggedIn && trialExpired ? (
            <Link href="/abonelik" className="flex flex-1 items-center justify-center rounded-lg bg-amber-500 py-2 text-xs font-semibold text-white">👑 Premium&apos;a Geç</Link>
          ) : (
            <button onClick={() => isLoggedIn ? null : openAuth()} className="flex-1 rounded-lg bg-[#6366f1] py-2 text-xs font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition-colors hover:bg-[#4f46e5]">⚡ Ücretsiz Test Al</button>
          )}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center rounded-lg bg-[#25d366] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1ebe5d]">💬 WhatsApp</a>
        </div>
      </div>

      {/* ─── Desktop Sticky CTA ─────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 hidden lg:flex flex-col gap-2 items-end">
        <div className="rounded-xl border border-[#1e3a5f] bg-[#111827]/95 p-3 shadow-2xl backdrop-blur-md w-52">
          <p className="mb-2 text-[11px] text-[#818cf8] text-center">⭐ 10.200+ aktif kullanıcı</p>
          {isLoggedIn && trialActive ? (
            <Link href="/profil" className="mb-1.5 flex w-full items-center justify-center rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white">✅ Testiniz Aktif</Link>
          ) : isLoggedIn && trialExpired ? (
            <Link href="/abonelik" className="mb-1.5 flex w-full items-center justify-center rounded-lg bg-amber-500 py-2 text-xs font-semibold text-white">👑 Test Bitti — Premium Al</Link>
          ) : (
            <button onClick={() => openAuth()} className="mb-1.5 w-full rounded-lg bg-[#6366f1] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4f46e5]">⚡ Ücretsiz Test Al</button>
          )}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center rounded-lg bg-[#25d366]/10 border border-[#25d366]/20 py-2 text-xs font-semibold text-[#25d366] transition-colors hover:bg-[#25d366]/20">💬 WhatsApp&apos;a Yaz</a>
        </div>
      </div>


      {/* ─── Auth Modal (Giriş / Kayıt) ─────────────────────────────────────── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#030712]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuthModal(false); }}>
          <div className="relative w-full max-w-sm overflow-y-auto rounded-t-2xl border border-[#1e2d42] bg-[#0a1525] p-5 shadow-2xl sm:rounded-2xl sm:p-6" style={{ maxHeight: '92vh' }}>
            <button onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#1e3a5f] hover:text-white">✕</button>

            {/* Sekme geçişi */}
            <div className="mb-6 flex rounded-xl border border-[#1e2d42] bg-[#060e1a] p-1">
              <button onClick={() => setAuthMode('register')}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${authMode === 'register' ? 'bg-[#3b82f6] text-white shadow' : 'text-[#6b7280] hover:text-white'}`}>
                Kayıt Ol
              </button>
              <button onClick={() => setAuthMode('login')}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${authMode === 'login' ? 'bg-[#3b82f6] text-white shadow' : 'text-[#6b7280] hover:text-white'}`}>
                Giriş Yap
              </button>
            </div>

            {authMode === 'register' ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">Hesap Oluştur</h3>
                  <p className="mt-1 text-sm text-[#6b7280]">Ücretsiz test için kayıt olun</p>
                </div>
                <a href="/kayit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1e2d42] bg-white py-3 text-sm font-bold text-[#111] transition-all hover:bg-gray-100">
                  E-posta ile Kayıt Ol →
                </a>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#1e2d42]" />
                  <span className="text-[11px] text-[#374151]">veya</span>
                  <div className="flex-1 h-px bg-[#1e2d42]" />
                </div>
                <p className="text-center text-xs text-[#6b7280]">
                  Zaten hesabınız var mı?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-[#3b82f6] hover:underline">Giriş yapın</button>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">Hoş Geldiniz</h3>
                  <p className="mt-1 text-sm text-[#6b7280]">Hesabınıza giriş yapın</p>
                </div>
                <a href="/giris"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1e2d42] bg-white py-3 text-sm font-bold text-[#111] transition-all hover:bg-gray-100">
                  E-posta ile Giriş Yap →
                </a>
                <p className="text-center text-xs text-[#6b7280]">
                  Hesabınız yok mu?{' '}
                  <button onClick={() => setAuthMode('register')} className="text-[#3b82f6] hover:underline">Kayıt olun</button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Modal ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#030712]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="relative w-full max-w-md overflow-y-auto rounded-t-2xl bg-[#111827] border border-[#1e3a5f] p-6 shadow-2xl sm:rounded-2xl" style={{ maxHeight: '92vh' }}>
            <button onClick={handleCloseModal} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#1e3a5f] hover:text-white">✕</button>
            <Stepper step={step} />

            {/* ── ADIM 1: Cihaz ─────────────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <div><h3 className="text-xl font-bold text-white">Hangi cihazda kullanacaksınız?</h3><p className="mt-1 text-sm text-[#9ca3af]">Kurulum rehberini cihazınıza göre hazırlayalım.</p></div>
                <div className="grid grid-cols-2 gap-2">
                  {DEVICES.map((device) => (
                    <button key={device.id} onClick={() => setSelectedDevice(device.id)} className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${selectedDevice === device.id ? 'border-[#6366f1]/60 bg-[#1e1b4b]' : 'border-[#1e3a5f] bg-[#0d1117] hover:border-[#3730a3]'}`}>
                      <span className="mb-1 text-xl">{device.icon}</span>
                      <span className="text-sm font-semibold text-white">{device.label}</span>
                      <span className="text-[11px] text-[#6b7280]">{device.sub}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1.5 as ModalStep)} disabled={!selectedDevice} className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5] disabled:opacity-40">Devam Et →</button>
                <p className="text-center text-xs text-[#6b7280]">Kredi kartı gerekmez · 3 saatlik ücretsiz erişim</p>
              </div>
            )}

            {/* ── ADIM 1.5: İzleme amacı ─────────────────────────────────────── */}
            {step === (1.5 as ModalStep) && (
              <div className="space-y-3">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-[#1e3a5f] bg-[#0d1117] px-2.5 py-1 text-xs text-[#9ca3af]">{DEVICES.find(d => d.id === selectedDevice)?.icon} {DEVICES.find(d => d.id === selectedDevice)?.label} seçildi</div>
                  <h3 className="text-xl font-bold text-white">En çok ne izleyeceksiniz?</h3>
                  <p className="mt-1 text-sm text-[#9ca3af]">Birden fazla seçebilirsiniz.</p>
                </div>
                <div className="space-y-2">
                  {PURPOSES.map((p) => {
                    const selected = selectedPurposes.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => setSelectedPurposes(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${selected ? 'border-[#6366f1]/60 bg-[#1e1b4b]' : 'border-[#1e3a5f] bg-[#0d1117] hover:border-[#3730a3]'}`}>
                        <span className="text-lg">{p.icon}</span>
                        <div className="flex-1"><div className="text-sm font-semibold text-white">{p.label}</div><div className="text-[11px] text-[#6b7280]">{p.sub}</div></div>
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${selected ? 'border-[#6366f1] bg-[#6366f1] text-white' : 'border-[#1e3a5f]'}`}>{selected ? '✓' : ''}</div>
                      </button>
                    );
                  })}
                </div>
                {recommendedPkg && selectedPurposes.length > 0 && (
                  <div className="rounded-xl border border-[#3730a3] bg-[#1e1b4b]/50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#818cf8]">✨ Size En Uygun Paket</p>
                    <p className="mt-0.5 text-sm font-bold text-white">{recommendedPkg}</p>
                    <p className="text-[11px] text-[#9ca3af]">Seçimlerinize göre bu paketi öneriyoruz.</p>
                  </div>
                )}
                <button onClick={() => setStep(2)} className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5]">Testi Başlat →</button>
                <button onClick={() => setStep(1)} className="w-full text-xs text-[#6b7280] transition-colors hover:text-[#9ca3af]">← Geri dön</button>
              </div>
            )}

            {/* ── ADIM 2: Email ──────────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div><h3 className="text-xl font-bold text-white">E-posta Adresiniz</h3><p className="mt-1 text-sm text-[#9ca3af]">Test bilgilerini göndereceğimiz e-posta adresinizi girin.</p></div>
                {selectedDevice && (
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1117] px-3 py-1.5 text-xs text-[#9ca3af]">{DEVICES.find(d => d.id === selectedDevice)?.icon} {DEVICES.find(d => d.id === selectedDevice)?.label}</div>
                    {selectedPurposes.map(pid => { const p = PURPOSES.find(x => x.id === pid); return p ? <div key={pid} className="rounded-lg border border-[#1e3a5f] bg-[#0d1117] px-3 py-1.5 text-xs text-[#9ca3af]">{p.icon} {p.label}</div> : null; })}
                    {recommendedPkg && <div className="rounded-lg border border-[#3730a3] bg-[#1e1b4b]/50 px-3 py-1.5 text-xs text-[#818cf8]">✨ Öneri: {recommendedPkg}</div>}
                  </div>
                )}
                <input ref={emailInputRef} type="email" placeholder="ornek@email.com" className="w-full rounded-xl border border-[#1e3a5f] bg-[#0d1117] px-4 py-3 text-sm text-white outline-none placeholder:text-[#4b5563] transition-colors focus:border-[#6366f1]/60" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()} />
                <p className="text-xs text-[#6b7280]">Geçici e-posta adresleri kabul edilmemektedir.</p>
                <button onClick={() => handleSendOtp(false)} disabled={loading} className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5] disabled:opacity-50">{loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}</button>
                {statusMsg && <p className="text-center text-xs text-amber-400">{statusMsg}</p>}
                <div className="flex justify-between text-xs">
                  <button onClick={() => setStep(1.5 as ModalStep)} className="text-[#6b7280] transition-colors hover:text-[#9ca3af]">← Geri dön</button>
                  <button onClick={() => handleSendOtp(true)} disabled={loading} className="text-[#818cf8] transition-colors hover:text-[#a5b4fc]">Daha önce test aldım →</button>
                </div>
                <div className="border-t border-[#1e3a5f] pt-3"><WaButton /></div>
              </div>
            )}

            {/* ── ADIM 3: OTP ─────────────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4 text-center">
                <div><h3 className="text-xl font-bold text-white">Kodu Doğrula</h3><p className="mt-1 text-sm text-[#9ca3af]"><span className="text-white">{email}</span> adresine gönderilen 6 haneli kodu girin.</p></div>
                <OTPInput value={otp} onChange={setOtp} />
                <p className="text-xs text-[#6b7280]">Spam klasörünü de kontrol edin.</p>
                {statusMsg && <p className="text-xs text-[#9ca3af]">{statusMsg}</p>}
                {isCreating ? (
                  <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1117] p-4"><CreatingProgress /></div>
                ) : (
                  <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40">{loading ? 'Lütfen Bekleyin...' : 'Onayla ve Testi Aç'}</button>
                )}
                {!isCreating && (
                  <div className="flex justify-between text-xs">
                    <button onClick={() => { setStep(2); setOtp(''); }} className="text-[#6b7280] transition-colors hover:text-[#9ca3af]">← Geri dön</button>
                    <button onClick={() => handleSendOtp(isRecovery)} disabled={loading || resendCooldown > 0} className="text-[#818cf8] transition-colors hover:text-[#a5b4fc] disabled:text-[#4b5563]">{resendCooldown > 0 ? `Tekrar gönder (${resendCooldown}s)` : 'Tekrar gönder'}</button>
                  </div>
                )}
                {!isCreating && <div className="border-t border-[#1e3a5f] pt-3"><WaButton /></div>}
              </div>
            )}

            {/* ── ADIM 4: Test Bilgileri ──────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/60 text-2xl">✅</div>
                  <h3 className="text-xl font-bold text-white">{isRecovery ? 'Bilgileriniz Hazır' : 'Testiniz Açıldı!'}</h3>
                  <p className="mt-1 text-sm text-[#9ca3af]">Bilgiler <span className="text-white">{email}</span> adresine gönderildi.</p>
                </div>
                {trialCredentials && (
                  <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1117] p-4 space-y-0">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
                        <span className="text-xs font-semibold text-emerald-400">Aktif Test</span>
                      </div>
                      <Countdown startedAt={trialCredentials.startedAt} />
                    </div>
                    <div className="divide-y divide-[#1e3a5f]">
                      {[{ label: 'Sunucu URL', value: 'http://pro4kiptv.xyz:2086', copy: 'http://pro4kiptv.xyz:2086/' }, { label: 'Kullanıcı Adı', value: trialCredentials.username, copy: trialCredentials.username }, { label: 'Şifre', value: trialCredentials.password, copy: trialCredentials.password }].map(row => (
                        <div key={row.label} className="flex items-center justify-between py-2.5 gap-2">
                          <span className="text-xs text-[#6b7280] shrink-0">{row.label}</span>
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="rounded-md bg-[#1e1b4b] px-2 py-0.5 font-mono text-xs font-bold text-[#818cf8] truncate max-w-[140px]">{row.value}</span>
                            <CopyButton value={row.copy} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-lg border border-[#1e3a5f] bg-[#111827] p-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">M3U Linki</span>
                        <CopyButton value={m3uLink} />
                      </div>
                      <p className="break-all font-mono text-[10px] leading-relaxed text-[#9ca3af]">{m3uLink}</p>
                    </div>
                  </div>
                )}
                <button onClick={() => setStep(5 as ModalStep)} className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5]">📲 Kurulumu Göster →</button>
                <WaButton label="💬 Beğendiyseniz Satın Alın" />
                <button onClick={handleCloseModal} className="w-full rounded-lg border border-[#1e3a5f] py-2.5 text-sm text-[#6b7280] transition-colors hover:text-white">Pencereyi Kapat</button>
              </div>
            )}

            {/* ── ADIM 5: Kurulum Rehberi ─────────────────────────────────────── */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="text-center"><h3 className="text-xl font-bold text-white">Kurulum Rehberi</h3><p className="mt-1 text-sm text-[#9ca3af]">Adım adım cihazına kuralım</p></div>
                <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1117] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">📋 Ne Yapmalısınız?</p>
                  <ol className="space-y-2.5">
                    {[{ n: '1', text: 'Uygulamayı cihazınıza indirin', sub: selectedDevice ? INSTALL_GUIDES[selectedDevice as DeviceId]?.app : 'IPTV Smarters Pro' }, { n: '2', text: 'Bilgileri uygulamaya girin', sub: 'Önceki ekrandaki sunucu, kullanıcı adı ve şifre' }, { n: '3', text: '3 saat boyunca deneyin', sub: 'Tüm kanalları, kaliteyi ve hızı test edin' }, { n: '4', text: 'Memnunsan paketi al', sub: 'WhatsApp\'tan kolayca satın alabilirsin' }].map(item => (
                      <li key={item.n} className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1e1b4b] text-[10px] font-bold text-[#818cf8]">{item.n}</span>
                        <div><p className="text-xs font-medium text-white">{item.text}</p><p className="text-[11px] text-[#6b7280]">{item.sub}</p></div>
                      </li>
                    ))}
                  </ol>
                </div>
                {selectedDevice && INSTALL_GUIDES[selectedDevice as DeviceId] && (() => {
                  const guide = INSTALL_GUIDES[selectedDevice as DeviceId];
                  return (
                    <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1117] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-base">{DEVICES.find(d => d.id === selectedDevice)?.icon}</span>
                        <div><p className="text-xs font-semibold text-white">Kurulum Adımları</p><p className="text-[11px] text-[#6b7280]">{guide.app}</p></div>
                      </div>
                      <ol className="space-y-2">
                        {guide.steps.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-xs text-[#9ca3af]">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1e1b4b] text-[10px] font-bold text-[#818cf8]">{i + 1}</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ol>
                      {guide.note && <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-[11px] leading-relaxed text-amber-400">💡 {guide.note}</p>}
                    </div>
                  );
                })()}
                <WaButton label="💬 Beğendiyseniz Satın Alın" />
                <button onClick={() => setStep(4 as ModalStep)} className="w-full text-xs text-[#6b7280] transition-colors hover:text-[#9ca3af]">← Test bilgilerine dön</button>
                <button onClick={handleCloseModal} className="w-full rounded-lg border border-[#1e3a5f] py-2.5 text-sm text-[#6b7280] transition-colors hover:text-white">Pencereyi Kapat</button>
              </div>
            )}

            {/* ── ADIM 6: Daha önce test alındı ──────────────────────────────── */}
            {step === 6 && (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-950/40 text-2xl">⏳</div>
                <div><h3 className="text-xl font-bold text-white">Daha Önce Test Aldınız</h3><p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">{alreadyUsedMsg}</p></div>
                <WaButton label="💬 WhatsApp ile Satın Al" />
                <button onClick={() => { setStep(1); setEmail(''); setAlreadyUsedMsg(''); }} className="w-full text-xs text-[#818cf8] transition-colors hover:text-[#a5b4fc]">Farklı e-posta ile dene</button>
                <button onClick={handleCloseModal} className="w-full text-xs text-[#6b7280] transition-colors hover:text-[#9ca3af]">Kapat</button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

// SessionProvider sarmalı — useSession'ın çalışması için gerekli
export default function HomePage() {
  return (
    <SessionProviderWrapper>
      <HomePageInner />
    </SessionProviderWrapper>
  );
}
