'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ─── Metadata notu ────────────────────────────────────────────────────────────
// Bu sayfa 'use client' olduğundan metadata'yı layout.tsx'e ekle:
// export const metadata = {
//   title: 'IPTV Satın Al | 4K IPTV Paketleri – Galya IPTV',
//   description: 'Türkiye\'nin en kaliteli IPTV hizmeti. 85.000+ kanal, 4K yayın. ₺500\'den başlayan fiyatlarla en iyi IPTV server. Ücretsiz test al.',
//   keywords: 'iptv satın al, iptv fiyat, 4k iptv, en iyi iptv, iptv server, iptv nedir',
// }

const WHATSAPP_URL = 'https://wa.me/447441921660?text=Merhaba%2C%20sat%C4%B1n%20almak%20istiyorum.';

// ─── Paket verileri ───────────────────────────────────────────────────────────
const packages = [
  {
    name: '1 Aylık Paket', duration: '1 Ay IPTV', price: '500',
    monthlyPrice: '500', saving: null,
    forWho: 'Denemek isteyenler için',
    features: ['85.000+ Kanal', 'Full HD Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'],
    popular: false,
  },
  {
    name: '3 Aylık Paket', duration: '3 Ay IPTV', price: '700',
    monthlyPrice: '233', saving: '%53',
    forWho: 'Kısa dönem kullanım',
    features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'],
    popular: false,
  },
  {
    name: '6 Aylık Paket', duration: '6 Ay IPTV', price: '1.000',
    monthlyPrice: '167', saving: '%67',
    forWho: 'Fiyat / performans seçimi',
    features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'],
    popular: false,
  },
  {
    name: '12 Aylık Paket', duration: '12 Ay IPTV', price: '1.400',
    monthlyPrice: '117', saving: '%77',
    forWho: 'En çok tercih edilen',
    features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'],
    popular: true,
  },
  {
    name: '24 Aylık Paket', duration: '24 Ay IPTV', price: '2.200',
    monthlyPrice: '92', saving: '%82',
    forWho: 'En düşük aylık maliyet',
    features: ['85.000+ Kanal', '4K Ultra HD', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum', 'VIP Destek'],
    popular: false,
  },
  {
    name: 'Süresiz Paket', duration: 'Sınırsız IPTV', price: '6.900',
    monthlyPrice: null, saving: null,
    forWho: 'Uzun vadeli kullanıcılar',
    features: ['85.000+ Kanal', '4K Ultra HD', '7/24 Destek', '2 Bağlantı', 'Ücretsiz Kurulum', 'VIP Destek'],
    popular: false,
  },
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

// ─── Paket önerici motoru ──────────────────────────────────────────────────────
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
  { initials: 'MK', name: 'M. Kaya', city: 'İstanbul', text: '12 aylık paketi aldım, kurulum 10 dakika sürdü. 2 aydır hiç donma yaşamadım. Fiyat-performans açısından gerçekten çok iyi.', stars: 5 },
  { initials: 'AY', name: 'A. Yılmaz', city: 'Ankara', text: 'Ücretsiz testi denedim, kaliteden ikna oldum ve hemen satın aldım. Spor kanalları çok net geliyor, 4K destekli TV\'de harika görünüyor.', stars: 5 },
  { initials: 'SO', name: 'S. Öztürk', city: 'İzmir', text: 'WhatsApp üzerinden kurulum desteği aldım, çok hızlı yardımcı oldular. Smart TV\'ye kolayca kuruldu. Kesinlikle tavsiye ederim.', stars: 5 },
  { initials: 'EC', name: 'E. Çelik', city: 'Bursa', text: 'Farklı IPTV sağlayıcılar denedim ama en stabil bu oldu. 6 aylık paket aldım, henüz hiçbir sorun yaşamadım.', stars: 5 },
  { initials: 'HK', name: 'H. Koç', city: 'Antalya', text: 'Kanal sayısı gerçekten çok fazla. Hem yerli hem yabancı kanallar mevcut. Test alarak denemek çok iyi bir fikir, güven veriyor.', stars: 5 },
];

const faqs = [
  { q: 'IPTV nedir ve nasıl çalışır?', a: 'IPTV, televizyon yayınlarının internet protokolü üzerinden izlenmesini sağlayan bir sistemdir. Kablolu yayın mantığından farklı olarak içerikler internet bağlantınız üzerinden cihazınıza ulaşır. Galya IPTV ile canlı TV, spor, film ve dizi içeriklerini birçok cihazda kolayca izleyebilirsiniz.' },
  { q: 'IPTV satın almadan önce test alabilir miyim?', a: 'Evet. Hizmeti satın almadan önce ücretsiz test talep ederek yayın kalitesini, kanal geçiş hızını ve cihaz uyumluluğunu görebilirsiniz. Test tamamen ücretsizdir, kredi kartı bilgisi gerekmez.' },
  { q: 'Hangi cihazlarda IPTV kullanabilirim?', a: 'Android TV, Smart TV, Android telefon, iPhone, tablet, TV Box, bilgisayar, Apple TV, MAG cihazlar ve daha fazlasında kullanabilirsiniz.' },
  { q: 'IPTV için ne kadar internet hızı gerekir?', a: 'Full HD yayın için minimum 10 Mbps, 4K yayın için minimum 25 Mbps internet hızı önerilir. Stabil bir bağlantı, hız kadar önemlidir.' },
  { q: 'IPTV donma sorunu neden olur?', a: 'Donma sorunu çoğu zaman internet hızı, Wi-Fi kalitesi, cihaz performansı veya uygulama seçimi nedeniyle olur. Galya IPTV altyapısından kaynaklanan donma durumlarında 7/24 destek hattımıza başvurabilirsiniz.' },
  { q: 'Kurulum desteği veriyor musunuz?', a: 'Evet. Satın alma sonrasında WhatsApp üzerinden adım adım kurulum desteği sağlıyoruz. IPTV Smarters, TiviMate ve diğer popüler uygulamalar için rehber hazırladık.' },
  { q: 'IPTV fiyatları neye göre değişiyor?', a: 'Fiyatlar paket süresine, bağlantı sayısına ve destek seviyesine göre değişir. Uzun vadeli paketlerde aylık maliyet çok daha düşük olur; 12 aylık pakette aylık maliyet yalnızca ₺117\'dir.' },
  { q: 'IPTV ile VPN kullanabilir miyim?', a: 'Evet, VPN kullanımı desteklenmektedir. Ancak bazı VPN sunucuları yayın hızını düşürebilir. Yerel Türkiye IP\'si ile en iyi performansı elde edersiniz.' },
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
  description: 'Türkiye\'nin en kaliteli IPTV hizmeti. 85.000+ kanal, 4K yayın kalitesi. ₺500\'den başlayan fiyatlarla en iyi IPTV server.',
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

// ─── localStorage anahtarları ─────────────────────────────────────────────────
const LS_KEY = 'galya_modal_progress';

// ─── Spin Wheel sabitleri ─────────────────────────────────────────────────────
const WHATSAPP_BASE = 'https://wa.me/447441921660';
const LS_SPIN_KEY   = 'galya_spin_entries';
const SPIN_PRIZES = [
  { label: '%5 İndirim',      chance: 0.30, bg: '#1e1b4b', text: '#818cf8' },
  { label: '%10 İndirim',     chance: 0.25, bg: '#1e3a5f', text: '#93c5fd' },
  { label: '+7 Gün Ücretsiz', chance: 0.20, bg: '#0f172a', text: '#a5b4fc' },
  { label: '+15 Gün Hediye',  chance: 0.15, bg: '#172554', text: '#bfdbfe' },
  { label: '%20 İndirim',     chance: 0.02, bg: '#6366f1', text: '#ffffff' },
  { label: '%8 İndirim',      chance: 0.08, bg: '#312e81', text: '#c7d2fe' },
] as const;
type SpinPrize = typeof SPIN_PRIZES[number];
const SPIN_SEG_ANGLE  = 360 / SPIN_PRIZES.length;
const SPIN_DURATION   = 5200;
const PRIZE_VALID_MS  = 15 * 60 * 1000;

interface SpinEntry { prizeIndex: number; wonAt: number }
interface SpinMap   { [phone: string]: SpinEntry }

// ─── Spin yardımcıları ────────────────────────────────────────────────────────
function spinLoadEntries(): SpinMap {
  try {
    const raw = localStorage.getItem(LS_SPIN_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return (typeof p === 'object' && p !== null) ? p as SpinMap : {};
  } catch { localStorage.removeItem(LS_SPIN_KEY); return {}; }
}
function spinSaveEntry(phone: string, entry: SpinEntry) {
  const m = spinLoadEntries(); m[phone] = entry;
  localStorage.setItem(LS_SPIN_KEY, JSON.stringify(m));
}
function spinValidatePhone(raw: string): { valid: boolean; normalized: string; error: string } {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('90')) d = d.slice(2);
  if (d.startsWith('0'))  d = d.slice(1);
  if ((d.length !== 10 && d.length !== 9) || !d.startsWith('5'))
    return { valid: false, normalized: '', error: 'Geçerli bir GSM numarası girin (05xx veya 5xx formatında)' };
  return { valid: true, normalized: d, error: '' };
}
function spinPickPrize(): number {
  let r = Math.random(), c = 0;
  for (let i = 0; i < SPIN_PRIZES.length; i++) { c += SPIN_PRIZES[i].chance; if (r < c) return i; }
  return 0;
}
function spinEaseOut(t: number) { return 1 - Math.pow(1 - t, 4); }
function spinFormatPhone(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0,4)} ${d.slice(4)}`;
  if (d.length <= 9) return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7)}`;
  return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7,9)} ${d.slice(9)}`;
}
function spinFmtCountdown(ms: number) {
  const s = Math.ceil(ms / 1000), m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2,'0')}`;
}
function spinBuildWaUrl(label: string) {
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(`Merhaba, kampanyadan "${label}" kazandım. Satın almak istiyorum.`)}`;
}

// ─── SpinWheel SVG bileşeni ───────────────────────────────────────────────────
function SpinWheelSVG({ rotation }: { rotation: number }) {
  const cx = 150, cy = 150, r = 138, inner = 28;
  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" style={{ transform: `rotate(${rotation}deg)` }}>
      <defs>
        <radialGradient id="sg-cg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818cf8"/><stop offset="100%" stopColor="#6366f1"/>
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r+5} fill="none" stroke="rgba(99,102,241,0.25)" strokeWidth="9"/>
      {SPIN_PRIZES.map((p, i) => {
        const a1 = (i*SPIN_SEG_ANGLE - 90) * Math.PI/180;
        const a2 = ((i+1)*SPIN_SEG_ANGLE - 90) * Math.PI/180;
        const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
        const x2=cx+r*Math.cos(a2), y2=cy+r*Math.sin(a2);
        const am=(a1+a2)/2, lr=r*0.63;
        const lx=cx+lr*Math.cos(am), ly=cy+lr*Math.sin(am);
        const rot=(am*180/Math.PI)+90;
        return (
          <g key={i}>
            <path d={`M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}Z`}
              fill={p.bg} stroke="rgba(99,102,241,0.2)" strokeWidth="1"/>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fill={p.text} fontSize="10.5" fontWeight="700" fontFamily="system-ui,sans-serif"
              transform={`rotate(${rot},${lx},${ly})`} style={{userSelect:'none'}}>
              {p.label}
            </text>
          </g>
        );
      })}
      {SPIN_PRIZES.map((_,i) => {
        const a=(i*SPIN_SEG_ANGLE-90)*Math.PI/180;
        return <line key={`l${i}`} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)}
          stroke="rgba(99,102,241,0.25)" strokeWidth="1"/>;
      })}
      {Array.from({length:12}).map((_,i)=>{
        const a=(i*30-90)*Math.PI/180, pr=r+7;
        return <circle key={`d${i}`} cx={cx+pr*Math.cos(a)} cy={cy+pr*Math.sin(a)} r="3.5"
          fill="#6366f1" opacity="0.85"/>;
      })}
      <circle cx={cx} cy={cy} r={inner+5} fill="rgba(30,27,75,0.5)"/>
      <circle cx={cx} cy={cy} r={inner} fill="url(#sg-cg)"/>
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="9" fontWeight="800" fontFamily="system-ui,sans-serif"
        style={{userSelect:'none'}}>ÇEVİR</text>
    </svg>
  );
}

// ─── SpinSection ────────────────────────────────────────────────────────────
function SpinSection({ onOpenModal }: { onOpenModal: () => void }) {
  type SpinPhase = 'form' | 'spinning' | 'result' | 'already_won';
  const [sPhone,    setPhone]   = useState('');
  const [sPhoneErr, setPhoneErr]= useState('');
  const [sNorm,     setNorm]    = useState('');
  const [sPhase,    setPhase]   = useState<SpinPhase>('form');
  const [sRot,      setRot]     = useState(0);
  const [sWonIdx,   setWonIdx]  = useState<number|null>(null);
  const [sWonAt,    setWonAt]   = useState<number|null>(null);
  const audCtx  = useRef<AudioContext|null>(null);
  const rafRef  = useRef<number|null>(null);
  const startTs = useRef<number|null>(null);
  const startRt = useRef(0);

  const expiresAt = sWonAt ? sWonAt + PRIZE_VALID_MS : null;
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const expired = remaining === 0 && expiresAt !== null;
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const playTick = useCallback(() => {
    try {
      if (!audCtx.current) audCtx.current = new (window.AudioContext||(window as any).webkitAudioContext)();
      const ctx=audCtx.current, o=ctx.createOscillator(), g=ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value=700+Math.random()*500;
      g.gain.setValueAtTime(0.05,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.04);
      o.start(); o.stop(ctx.currentTime+0.04);
    } catch {}
  }, []);

  const playWin = useCallback(() => {
    try {
      if (!audCtx.current) audCtx.current = new (window.AudioContext||(window as any).webkitAudioContext)();
      const ctx=audCtx.current;
      [523,659,784,1047].forEach((f,i) => {
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.frequency.value=f;
        g.gain.setValueAtTime(0,ctx.currentTime+i*0.13);
        g.gain.linearRampToValueAtTime(0.12,ctx.currentTime+i*0.13+0.05);
        g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.13+0.3);
        o.start(ctx.currentTime+i*0.13); o.stop(ctx.currentTime+i*0.13+0.35);
      });
    } catch {}
  }, []);

  function handlePhoneSubmit() {
    const {valid, normalized, error} = spinValidatePhone(sPhone);
    if (!valid) { setPhoneErr(error); return; }
    setPhoneErr(''); setNorm(normalized);
    const entries = spinLoadEntries();
    if (entries[normalized]) {
      setWonIdx(entries[normalized].prizeIndex);
      setWonAt(entries[normalized].wonAt);
      setPhase('already_won'); return;
    }
    startSpin(normalized);
  }

  function startSpin(norm: string) {
    const idx = spinPickPrize();
    const segCenter = (idx * SPIN_SEG_ANGLE + SPIN_SEG_ANGLE / 2) % 360;
    const toTop = (360 - segCenter) % 360;
    const currentNorm = ((sRot % 360) + 360) % 360;
    const extraToTarget = (toTop - currentNorm + 360) % 360;
    const total = 5 * 360 + extraToTarget;

    startRt.current = sRot;
    setWonIdx(idx); setPhase('spinning');
    startTs.current = null;
    let lastSeg = -1;

    function animate(ts: number) {
      if (!startTs.current) startTs.current = ts;
      const prog = Math.min((ts - startTs.current) / SPIN_DURATION, 1);
      const cur = startRt.current + spinEaseOut(prog) * total;
      setRot(cur);
      const seg = Math.floor(((cur % 360 + 360) % 360) / SPIN_SEG_ANGLE);
      if (seg !== lastSeg) { playTick(); lastSeg = seg; }
      if (prog < 1) { rafRef.current = requestAnimationFrame(animate); }
      else {
        setRot(startRt.current + total);
        const now = Date.now();
        setWonAt(now);
        spinSaveEntry(norm, { prizeIndex: idx, wonAt: now });
        playWin(); setPhase('result');
      }
    }
    rafRef.current = requestAnimationFrame(animate);
  }

  const wonPrize: SpinPrize|null = sWonIdx !== null ? SPIN_PRIZES[sWonIdx] : null;
  const waUrl = wonPrize ? spinBuildWaUrl(wonPrize.label) : WHATSAPP_URL;

  if (sPhase === 'form') return (
    <div className="space-y-4">
      <p className="text-center text-sm text-[#818cf8]">
        Numaranı gir, çarkı çevir — özel indirimini kap!
      </p>
      <div className="flex gap-2">
        <div className="flex items-center rounded-lg border border-[#1e3a5f] bg-[#1e1b4b]/30 px-3 text-sm text-[#818cf8] whitespace-nowrap">
          🇹🇷 +90
        </div>
        <input type="tel" inputMode="numeric" placeholder="05xx xxx xx xx"
          value={sPhone}
          onChange={e => { setPhone(spinFormatPhone(e.target.value)); setPhoneErr(''); }}
          onKeyDown={e => e.key==='Enter' && handlePhoneSubmit()}
          className="flex-1 rounded-lg border border-[#1e3a5f] bg-[#111827] px-3 py-2.5 text-sm text-white placeholder-[#4b5563] outline-none focus:border-[#6366f1]/60"/>
      </div>
      {sPhoneErr && <p className="text-xs text-red-400">{sPhoneErr}</p>}
      <button onClick={handlePhoneSubmit}
        className="w-full rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]">
        🎡 Çarkı Çevir
      </button>
      <p className="text-center text-[10px] text-[#6b7280]">Her numara 1 kez. Ödül 15 dk geçerli.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="relative mx-auto" style={{ width: 240, height: 240 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 z-10">
          <div className="w-0 h-0" style={{
            borderLeft:'9px solid transparent', borderRight:'9px solid transparent',
            borderTop:'20px solid #6366f1',
            filter:'drop-shadow(0 2px 4px rgba(99,102,241,0.8))',
          }}/>
        </div>
        <SpinWheelSVG rotation={sRot}/>
      </div>

      {sPhase === 'spinning' && (
        <p className="text-center text-xs text-[#818cf8] animate-pulse">Çark dönüyor…</p>
      )}

      {(sPhase === 'result' || sPhase === 'already_won') && wonPrize && (
        <div className="space-y-3">
          {sPhase === 'already_won' && (
            <p className="text-center text-xs text-amber-400">⚠️ Bu numara daha önce katıldı</p>
          )}
          <div className={`rounded-xl border p-4 text-center ${
            expired ? 'border-[#1e3a5f]/50 opacity-50' : 'border-[#6366f1]/40 bg-[#1e1b4b]/40'
          }`}>
            <p className="text-xs text-[#818cf8] mb-1">{expired ? 'Süre doldu' : 'Kazandın 🎉'}</p>
            <p className="text-2xl font-extrabold text-white">{wonPrize.label}</p>
            {!expired && (
              <p className="mt-1 text-xs text-amber-400">⏱ {spinFmtCountdown(remaining)} kaldı</p>
            )}
          </div>
          {!expired && (
            <div className="space-y-2">
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 text-sm font-bold text-white transition-all hover:bg-[#1ebe5d]">
                💬 WhatsApp&apos;tan Kullan
              </a>
              <button onClick={onOpenModal}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] py-3 text-sm font-bold text-white transition-all hover:opacity-90">
                ⚡ Ücretsiz Test Al
              </button>
            </div>
          )}
          {sPhase === 'already_won' && (
            <button onClick={() => { setPhone(''); setNorm(''); setPhase('form'); }}
              className="w-full text-xs text-[#818cf8] hover:text-[#a5b4fc] py-1">
              Farklı numara →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Toast bileşeni ───────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastMsg { id: number; message: string; type: ToastType }

function ToastContainer({ toasts, onRemove }: { toasts: ToastMsg[]; onRemove: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 flex-col-reverse gap-2 md:bottom-8">
      {toasts.map((t) => (
        <div key={t.id} onClick={() => onRemove(t.id)}
          className={`pointer-events-auto flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md transition-all ${
            t.type === 'success' ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300' :
            t.type === 'error'   ? 'border-red-500/40 bg-red-950/80 text-red-300' :
            t.type === 'warning' ? 'border-amber-500/40 bg-amber-950/80 text-amber-300' :
                                   'border-[#1e3a5f] bg-[#111827]/95 text-[#818cf8]'
          }`}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 6 kutulu OTP input ───────────────────────────────────────────────────────
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

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) { onChange(pasted); setTimeout(() => inputs.current[Math.min(pasted.length, 5)]?.focus(), 0); }
    e.preventDefault();
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`h-12 w-10 rounded-xl border bg-[#111827] text-center font-mono text-xl font-bold text-white outline-none transition-all ${
            value[i] ? 'border-[#6366f1]/60 bg-[#1e1b4b]/40' : 'border-[#1e3a5f] focus:border-[#6366f1]/40'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Yıldız bileşeni ──────────────────────────────────────────────────────────
function Stars({ count = 5 }: { count?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-amber-400 text-sm">★</span>
      ))}
    </span>
  );
}

// ─── Kopyala butonu ───────────────────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handle}
      className={`ml-2 rounded-md border px-2 py-0.5 text-xs transition-all ${
        copied ? 'border-emerald-500/60 text-emerald-400' : 'border-[#1e3a5f] text-[#818cf8] hover:border-[#6366f1]/50 hover:text-[#a5b4fc]'
      }`}>
      {copied ? '✓ Kopyalandı' : 'Kopyala'}
    </button>
  );
}

// ─── 12 saat geri sayım ───────────────────────────────────────────────────────
function Countdown({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const total = 12 * 60 * 60 * 1000;
    const calc = () => Math.max(0, total - (Date.now() - startedAt));
    setRemaining(calc());
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
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

// ─── Stepper ──────────────────────────────────────────────────────────────────
const STEP_LABELS = ['Cihaz', 'E-posta', 'Doğrula', 'Test', 'Kurulum'];
function Stepper({ step }: { step: ModalStep }) {
  const active = step === 1 ? 1 : step === 1.5 ? 1 : step === 6 ? 5 : Math.min(step as number, 5);
  return (
    <div className="mb-5 flex items-center justify-center gap-1">
      {STEP_LABELS.map((label, i) => {
        const idx = i + 1;
        const done = active > idx;
        const current = active === idx;
        return (
          <span key={label} className="flex items-center gap-1">
            <span className="flex flex-col items-center gap-0.5">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                done ? 'bg-[#6366f1] text-white' : current ? 'border-2 border-[#6366f1] text-[#818cf8]' : 'border border-[#1e3a5f] text-[#4b5563]'
              }`}>
                {done ? '✓' : idx}
              </span>
              <span className={`text-[9px] ${current ? 'text-[#818cf8]' : done ? 'text-[#6366f1]' : 'text-[#4b5563]'}`}>{label}</span>
            </span>
            {i < STEP_LABELS.length - 1 && <span className={`mb-4 h-px w-8 ${done ? 'bg-[#6366f1]' : 'bg-[#1e3a5f]'}`} />}
          </span>
        );
      })}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function CreatingProgress() {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const statuses = ['Yayın bağlantısı kuruluyor...', 'Yayın hazırlanıyor...', 'Test hesabınız oluşturuluyor...', 'Son kontroller yapılıyor...'];
  useEffect(() => {
    const duration = 35000;
    const interval = 200;
    const stepVal = 90 / (duration / interval);
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

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [showCompare, setShowCompare] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [exitPopupShown, setExitPopupShown] = useState(false);
  const [recommendedPkg, setRecommendedPkg] = useState('');
  const [showSpinPopup, setShowSpinPopup] = useState(false);
  const [spinBannerDismissed, setSpinBannerDismissed] = useState(false);
  const toastIdRef = useRef(0);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 2) setTimeout(() => emailInputRef.current?.focus(), 100);
  }, [step]);

  useEffect(() => {
    if (selectedDevice && selectedPurposes.length > 0) {
      setRecommendedPkg(getRecommendedPackage(selectedDevice, selectedPurposes));
    }
  }, [selectedDevice, selectedPurposes]);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !exitPopupShown && !isModalOpen) {
        setShowExitPopup(true);
        setExitPopupShown(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [exitPopupShown, isModalOpen]);

  const handleOpenModal = (pkg?: string) => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.device) setSelectedDevice(parsed.device);
        if (parsed.purposes) setSelectedPurposes(parsed.purposes);
        if (parsed.email) setEmail(parsed.email);
      } else {
        setSelectedDevice(''); setSelectedPurposes([]); setEmail('');
      }
    } catch {
      setSelectedDevice(''); setSelectedPurposes([]); setEmail('');
    }
    setIsModalOpen(true); setStep(1); setSelectedPackage(pkg || '');
    setOtp(''); setOtpToken(''); setStatusMsg(''); setAlreadyUsedMsg('');
    setResendCooldown(0); setIsRecovery(false); setTrialCredentials(null); setIsCreating(false);
  };

  const handleCloseModal = () => {
    if (step !== 4) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ device: selectedDevice, purposes: selectedPurposes, email }));
      } catch { }
    } else {
      try { localStorage.removeItem(LS_KEY); } catch { }
    }
    setIsModalOpen(false); setStep(1); setSelectedPackage('');
    setSelectedDevice(''); setSelectedPurposes([]);
    setEmail(''); setOtp(''); setOtpToken('');
    setStatusMsg(''); setAlreadyUsedMsg('');
    setLoading(false); setResendCooldown(0); setIsRecovery(false);
    setTrialCredentials(null); setIsCreating(false);
  };

  const handleSendOtp = async (recoveryMode = false) => {
    if (!email) return addToast('Lütfen e-posta adresinizi girin.', 'warning');
    setLoading(true); setStatusMsg('');
    try {
      const res = await fetch('/api/test-talep', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', email, selectedPackage }),
      });
      const data = await res.json();
      if (data.alreadyUsed) {
        if (recoveryMode) { setIsRecovery(true); }
        else { setAlreadyUsedMsg(data.error); setStep(6 as ModalStep); return; }
      }
      if (data.cooldown) { setResendCooldown(data.retryAfter || 60); setStatusMsg(data.error); return; }
      if (data.success) { setOtpToken(data.token); setIsRecovery(recoveryMode); setStep(3); setResendCooldown(60); addToast('Doğrulama kodu gönderildi.', 'success'); }
      else { addToast(data.error || 'Kod gönderilemedi.', 'error'); }
    } catch { addToast('Sunucuya bağlanılamadı. WhatsApp üzerinden destek alabilirsiniz.', 'error'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) return addToast('Lütfen 6 haneli doğrulama kodunu girin.', 'warning');
    setLoading(true);
    if (!isRecovery) setIsCreating(true);
    setStatusMsg(isRecovery ? 'Bilgileriniz getiriliyor...' : '');
    try {
      const action = isRecovery ? 'recover' : 'verify';
      const res = await fetch('/api/test-talep', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email, otp, token: otpToken }),
      });
      const data = await res.json();
      if (data.alreadyUsed) { setAlreadyUsedMsg(data.error); setStep(6 as ModalStep); setStatusMsg(''); setIsCreating(false); return; }
      if (data.success) {
        setTrialCredentials({ username: data.username, password: data.password, startedAt: Date.now() });
        setStep(4); setStatusMsg(''); setIsCreating(false);
        addToast('Test hesabınız hazır!', 'success');
      } else {
        addToast(data.error || 'Kod hatalı. Lütfen tekrar deneyin.', 'error');
        setStatusMsg(''); setIsCreating(false);
      }
    } catch {
      addToast('Bir hata oluştu. Tekrar deneyin.', 'error');
      setStatusMsg(''); setIsCreating(false);
    }
    finally { setLoading(false); }
  };

  const m3uLink = trialCredentials
    ? `http://pro4kiptv.xyz:2086/get.php?username=${trialCredentials.username}&password=${trialCredentials.password}&type=m3u&output=ts`
    : '';

  const WaButton = ({ label = '💬 WhatsApp ile Satın Al' }: { label?: string }) => (
    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 text-sm font-bold text-white transition-colors hover:bg-[#1ebe5d]">
      {label}
    </a>
  );

  const compareRows = [
    { label: 'Kanal Sayısı',    values: ['85.000+', '85.000+', '85.000+', '85.000+', '85.000+', '85.000+'] },
    { label: 'Görüntü',         values: ['Full HD', '4K', '4K', '4K', '4K Ultra HD', '4K Ultra HD'] },
    { label: 'Bağlantı',        values: ['1', '1', '1', '1', '1', '2'] },
    { label: 'VIP Destek',      values: ['✗', '✗', '✗', '✗', '✓', '✓'] },
    { label: 'Aylık Maliyet',   values: ['₺500', '₺233', '₺167', '₺117', '₺92', '—'] },
    { label: 'Tasarruf',        values: ['—', '%53', '%67', '%77', '%82', 'Tek ödeme'] },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ─── Exit-intent popup ───────────────────────────────────────────────── */}
      {showExitPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#030712]/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-[#1e3a5f] bg-[#111827] p-6 text-center shadow-2xl">
            <button onClick={() => setShowExitPopup(false)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#1e3a5f] hover:text-white">✕</button>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#1e1b4b] text-2xl">🎁</div>
            <h3 className="mb-1 text-lg font-bold text-white">Gitmeden önce bir dakika!</h3>
            <p className="mb-4 text-sm text-[#9ca3af]">12 saatlik <strong className="text-white">ücretsiz test</strong> hesabı açılsın mı? Kredi kartı gerekmez.</p>
            <button onClick={() => { setShowExitPopup(false); handleOpenModal(); }}
              className="mb-2 w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5]">
              ⚡ Evet, Ücretsiz Test Al
            </button>
            <button onClick={() => setShowExitPopup(false)} className="text-xs text-[#6b7280] transition-colors hover:text-[#9ca3af]">
              Hayır, teşekkürler
            </button>
          </div>
        </div>
      )}

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#1e3a5f] bg-[#030712]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Galya <span className="text-[#818cf8]">IPTV</span>
          </Link>

          <div className="hidden items-center gap-7 text-sm text-[#9ca3af] md:flex">
            <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
            <Link href="/#yorumlar" className="transition-colors hover:text-white">Yorumlar</Link>
            <Link href="/#neden-biz" className="transition-colors hover:text-white">Neden Biz</Link>
            <Link href="/#sss" className="transition-colors hover:text-white">S.S.S</Link>
            <Link href="/araclar" className="transition-colors hover:text-white">Araçlar</Link>
            <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
            <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
            <button onClick={() => handleOpenModal()}
              className="rounded-lg border border-[#3730a3] bg-[#1e1b4b] px-4 py-2 text-sm font-medium text-[#818cf8] transition-all hover:bg-[#312e81] hover:text-white">
              Ücretsiz Test
            </button>
          </div>

          <button className="flex flex-col gap-1.5 p-2 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menüyü aç">
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-[#1e3a5f] bg-[#0d1117] px-6 pb-4 md:hidden">
            <div className="flex flex-col gap-1 pt-3 text-sm">
              {[
                { href: '/#paketler', label: 'Paketler' },
                { href: '/#yorumlar', label: 'Yorumlar' },
                { href: '/#neden-biz', label: 'Neden Biz' },
                { href: '/#sss', label: 'S.S.S' },
                { href: '/araclar', label: 'Araçlar' },
                { href: '/blog', label: 'Blog' },
                { href: '/iletisim', label: 'İletişim' },
              ].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[#9ca3af] transition-colors hover:bg-[#1e3a5f]/30 hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="bg-[#030712] text-white">

        {/* ─── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-[#6366f1]/5 blur-3xl" />
          <div className="relative mx-auto max-w-4xl">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#3730a3] bg-[#1e1b4b] px-4 py-1.5 text-xs text-[#818cf8]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Bu ay <span className="text-white font-medium mx-1">847 kişi</span> satın aldı · 4K Yayın · 85.000+ Kanal
            </div>

            <h1 className="mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl text-white">
              IPTV Satın Al –<br />
              <span className="text-[#818cf8]">4K Kalite, 85.000+ Kanal</span>
            </h1>

            <p className="mx-auto mb-4 max-w-2xl text-base leading-relaxed text-[#9ca3af] md:text-lg">
              En iyi IPTV server ile canlı TV, spor, film ve dizi — tek üyelikle tüm cihazlarda.
              ₺500'den başlayan fiyatlarla, <strong className="text-[#a5b4fc] font-medium">ücretsiz test</strong> ile başla.
            </p>

            <p className="mb-8 text-xs text-[#6b7280]">
              Kredi kartı gerektirmez · 12 saatlik ücretsiz erişim · Anında kurulum
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={() => handleOpenModal()}
                className="w-full sm:w-auto rounded-xl bg-[#6366f1] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#6366f1]/25 transition-all hover:bg-[#4f46e5] hover:shadow-[#6366f1]/40 hover:scale-[1.02]">
                ⚡ Ücretsiz Test Al
              </button>
              <Link href="/#paketler"
                className="w-full sm:w-auto rounded-xl border border-[#1e3a5f] px-8 py-4 text-base font-semibold text-[#9ca3af] transition-all hover:bg-[#1e3a5f]/30 hover:text-white hover:border-[#3730a3]">
                IPTV Fiyatlarına Bak →
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#6b7280]">
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> 10.000+ mutlu kullanıcı</span>
              <span className="hidden sm:block text-[#1e3a5f]">|</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> %99.9 uptime garantisi</span>
              <span className="hidden sm:block text-[#1e3a5f]">|</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> 7/24 teknik destek</span>
              <span className="hidden sm:block text-[#1e3a5f]">|</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Anında kurulum</span>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { v: '85.000+', l: 'Canlı Kanal' },
                { v: '4K / FHD', l: 'Görüntü Kalitesi' },
                { v: '10.000+', l: 'Aktif Kullanıcı' },
                { v: '7/24', l: 'Teknik Destek' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-[#1e3a5f] bg-[#111827] p-4 text-left transition-colors hover:border-[#3730a3]">
                  <div className="text-lg font-bold text-[#818cf8]">{s.v}</div>
                  <div className="mt-0.5 text-xs text-[#6b7280]">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── "Neden test almalıyım?" mini blok ─────────────────────────────── */}
        <section className="border-t border-[#1e3a5f] px-6 py-10">
          <div className="mx-auto max-w-3xl">
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-[#6b7280]">Neden Önce Test Almalısınız?</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: '🔍', title: 'Kaliteyi Önce Görün', desc: 'Satın almadan önce yayın kalitesini ve kanal sayısını bizzat test edin.' },
                { icon: '📱', title: 'Cihaz Uyumluluğunu Deneyin', desc: 'Kendi cihazınızda çalışıp çalışmadığını önceden doğrulayın.' },
                { icon: '❄️', title: 'Donma Performansını Kontrol Edin', desc: 'İnternet hızınızla uyumlu mu? Test ederek emin olun.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-xl border border-[#1e3a5f] bg-[#111827] p-4">
                  <span className="mt-0.5 text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#9ca3af]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 text-center">
              <button onClick={() => handleOpenModal()}
                className="rounded-xl bg-[#1e1b4b] border border-[#3730a3] px-6 py-2.5 text-sm font-semibold text-[#818cf8] transition-all hover:bg-[#312e81]">
                ⚡ Ücretsiz Testi Başlat
              </button>
            </div>
          </div>
        </section>

        {/* ─── Güven rozetleri şeridi ─────────────────────────────────────────── */}
        <section className="border-y border-[#1e3a5f] bg-[#0d1117] px-6 py-5">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: '🔒', label: 'SSL Güvenli' },
              { icon: '💬', label: 'WhatsApp Destek' },
              { icon: '🆓', label: 'Ücretsiz Test' },
              { icon: '⚡', label: 'Anında Kurulum' },
              { icon: '🛡️', label: 'Gizlilik Korumalı' },
              { icon: '↩️', label: 'Sorun Çözme Garantisi' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs text-[#6b7280]">
                <span className="text-base">{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Packages ──────────────────────────────────────────────────────── */}
        <section id="paketler" className="border-t border-[#1e3a5f] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">IPTV Paket Fiyatları</h2>
              <p className="mt-3 text-sm text-[#9ca3af]">Tek seferlik ödeme, abonelik yok. Uzun vadede büyük tasarruf.</p>
            </div>

            <div className="mb-8 text-center">
              <button onClick={() => setShowCompare(!showCompare)}
                className="rounded-lg border border-[#1e3a5f] bg-[#111827] px-4 py-2 text-xs font-medium text-[#818cf8] transition-all hover:border-[#3730a3] hover:text-white">
                {showCompare ? '▲ Tabloyu Gizle' : '⇄ Paketleri Karşılaştır'}
              </button>
            </div>

            {showCompare && (
              <div className="mb-10 overflow-x-auto rounded-2xl border border-[#1e3a5f]">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-[#1e3a5f] bg-[#0d1117]">
                      <th className="px-4 py-3 text-left font-medium text-[#6b7280]">Özellik</th>
                      {packages.map((p) => (
                        <th key={p.name} className={`px-3 py-3 text-center font-semibold ${p.popular ? 'text-[#818cf8]' : 'text-white'}`}>
                          {p.name.replace(' Paket', '')}
                          {p.popular && <span className="ml-1 text-[10px] text-[#818cf8]">★</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row, ri) => (
                      <tr key={row.label} className={`border-b border-[#1e3a5f] ${ri % 2 === 0 ? '' : 'bg-[#0d1117]/50'}`}>
                        <td className="px-4 py-2.5 text-[#9ca3af]">{row.label}</td>
                        {row.values.map((val, vi) => (
                          <td key={vi} className={`px-3 py-2.5 text-center ${
                            packages[vi]?.popular ? 'text-[#818cf8] font-semibold'
                            : val === '✗' ? 'text-[#4b5563]'
                            : val === '✓' ? 'text-emerald-400'
                            : 'text-white'
                          }`}>{val}</td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-[#1e1b4b]/40">
                      <td className="px-4 py-3 font-medium text-[#9ca3af]">Toplam Fiyat</td>
                      {packages.map((p) => (
                        <td key={p.name} className={`px-3 py-3 text-center font-bold ${p.popular ? 'text-[#818cf8]' : 'text-white'}`}>
                          ₺{p.price}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <div key={pkg.name}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                    pkg.popular
                      ? 'border-[#6366f1]/60 bg-[#111827] shadow-xl shadow-[#6366f1]/10'
                      : 'border-[#1e3a5f] bg-[#111827] hover:border-[#3730a3] hover:bg-[#0d1117]'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6366f1] to-[#4f46e5] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#6366f1]/30">
                      ⭐ En Çok Tercih Edilen
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-[#818cf8]">{pkg.duration}</div>
                    <h3 className="mt-1.5 text-lg font-bold text-white">{pkg.name}</h3>
                    <span className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      pkg.popular ? 'bg-[#1e1b4b] text-[#818cf8]' : 'bg-[#0d1117] text-[#6b7280]'
                    }`}>
                      {pkg.forWho}
                    </span>
                  </div>

                  <div className="mb-2">
                    <span className="text-4xl font-extrabold text-white">₺{pkg.price}</span>
                    <span className="ml-1.5 text-sm text-[#6b7280]">tek ödeme</span>
                  </div>
                  {pkg.monthlyPrice ? (
                    <div className="mb-5 flex items-center gap-2">
                      <span className="text-xs text-[#9ca3af]">
                        Aylık yalnızca <span className={`font-semibold ${pkg.popular ? 'text-[#818cf8]' : 'text-white'}`}>₺{pkg.monthlyPrice}</span>
                      </span>
                      {pkg.saving && (
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${pkg.popular ? 'bg-[#1e1b4b] text-[#818cf8]' : 'bg-emerald-950/60 text-emerald-400'}`}>
                          {pkg.saving} tasarruf
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mb-5 text-xs text-[#6b7280]">Ömür boyu tek ödeme</div>
                  )}

                  <ul className="mb-6 flex-1 space-y-2.5">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-[#9ca3af]">
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${pkg.popular ? 'bg-[#1e1b4b] text-[#818cf8]' : 'bg-emerald-950/60 text-emerald-400'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <a href={`https://wa.me/447441921660?text=Merhaba%2C%20${encodeURIComponent(pkg.name)}%20sat%C4%B1n%20almak%20istiyorum.`}
                    target="_blank" rel="noopener noreferrer"
                    className={`mb-3 flex w-full items-center justify-center rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                      pkg.popular
                        ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/25 hover:bg-[#4f46e5]'
                        : 'border border-[#1e3a5f] bg-[#0d1117] text-[#9ca3af] hover:bg-[#1e3a5f]/40 hover:border-[#3730a3] hover:text-white'
                    }`}>
                    💬 WhatsApp ile Satın Al
                  </a>
                  <button onClick={() => handleOpenModal(pkg.name)}
                    className="flex w-full items-center justify-center rounded-xl border border-[#1e3a5f] bg-[#111827] px-3 py-2.5 text-xs font-medium text-[#818cf8] transition-all hover:border-[#3730a3] hover:text-white">
                    Önce Ücretsiz Test Al
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-[#6b7280]">
              💳 Ödeme WhatsApp üzerinden güvenli şekilde gerçekleşir · Kurulum desteği dahil · Sorun yaşarsanız çözüm garantisi
            </p>
          </div>
        </section>

        {/* ─── Müşteri Yorumları ──────────────────────────────────────────────── */}
        <section id="yorumlar" className="border-t border-[#1e3a5f] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">Müşteri Yorumları</h2>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Stars count={5} />
                <span className="text-sm text-[#9ca3af]">10.000+ kullanıcı · Ortalama <strong className="text-white">4.9</strong>/5</span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <div key={r.initials} className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-5 transition-all hover:border-[#3730a3]">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e1b4b] text-sm font-bold text-[#818cf8]">
                        {r.initials}
                      </div>
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
              <p className="mb-4 text-sm text-[#9ca3af]">Siz de denemek ister misiniz? Önce ücretsiz test alın.</p>
              <button onClick={() => handleOpenModal()}
                className="rounded-xl bg-[#6366f1] px-8 py-3.5 font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition-all hover:bg-[#4f46e5] hover:scale-[1.02]">
                Ücretsiz Test Al →
              </button>
            </div>
          </div>
        </section>

        {/* ─── Neden Biz ─────────────────────────────────────────────────────── */}
        <section id="neden-biz" className="border-t border-[#1e3a5f] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl text-white">Neden Galya IPTV?</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: '📺', title: 'Geniş İçerik', desc: 'Canlı TV, spor, belgesel, film ve dizi kategorilerinde 85.000+ kanal.' },
                { icon: '🎯', title: '4K ve Full HD', desc: 'Destekleyen cihazlarda daha net, daha keskin izleme deneyimi.' },
                { icon: '⚡', title: '%99.9 Uptime', desc: 'Güçlü altyapı ve optimize edilmiş yayın yapısı ile stabil bağlantı.' },
                { icon: '🛡️', title: 'Kurulum Yardımı', desc: 'Satın alma sonrası WhatsApp üzerinden adım adım kurulum desteği.' },
                { icon: '📱', title: 'Tüm Cihazlar', desc: 'Smart TV, mobil, TV Box, bilgisayar, Apple TV ve daha fazlası.' },
                { icon: '🆓', title: 'Önce Test Et', desc: 'Kredi kartı gerekmez. Satın almadan 12 saatlik ücretsiz test al.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-[#1e3a5f] bg-[#111827] p-5 transition-all hover:border-[#3730a3]">
                  <div className="mb-3 text-2xl">{item.icon}</div>
                  <h3 className="mb-1.5 font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#9ca3af]">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <button onClick={() => handleOpenModal()}
                className="rounded-xl border border-[#1e3a5f] bg-[#111827] px-8 py-3.5 font-semibold text-[#818cf8] transition-all hover:bg-[#1e3a5f]/40 hover:text-white">
                Hemen Test Al →
              </button>
            </div>
          </div>
        </section>

        {/* ─── Endişeleri giderme bölümü ───────────────────────────────────── */}
        <section className="border-t border-[#1e3a5f] px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#6b7280]">Aklınızdaki Soruları Biliyoruz</p>
            <h2 className="mb-8 text-center text-2xl font-bold tracking-tight md:text-3xl text-white">Endişelerinizi Gideriyoruz</h2>
            <div className="space-y-3">
              {[
                { concern: 'Donma sorunu olur mu?', answer: 'Testte bizzat deneyin. Altyapımız %99.9 uptime garantisi verir.' },
                { concern: 'Kurulum bilmiyorum.', answer: 'Endişelenmeyin — satın alma sonrası WhatsApp\'tan adım adım yardım sağlıyoruz.' },
                { concern: 'Cihazımda çalışır mı?', answer: 'Ücretsiz test ile kendi cihazınızda önce deneyin, sonra karar verin.' },
                { concern: 'Param boşa giderse?', answer: 'Sorun yaşarsanız destek hattımız çözüm garantisi verir.' },
              ].map((item) => (
                <div key={item.concern} className="flex items-start gap-4 rounded-xl border border-[#1e3a5f] bg-[#111827] px-5 py-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e1b4b] text-[11px] font-bold text-[#818cf8]">?</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.concern}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#9ca3af]">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SSS ───────────────────────────────────────────────────────────── */}
        <section id="sss" className="border-t border-[#1e3a5f] px-6 py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-3 text-center text-3xl font-bold tracking-tight md:text-4xl text-white">Sıkça Sorulan Sorular</h2>
            <p className="mb-10 text-center text-sm text-[#9ca3af]">IPTV satın almadan önce merak ettikleriniz</p>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-[#1e3a5f] bg-[#111827] px-5 py-4 transition-colors hover:border-[#3730a3]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white">
                    {faq.q}
                    <span className="shrink-0 text-[10px] text-[#6b7280] transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[#9ca3af]">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Final ─────────────────────────────────────────────────────── */}
        <section className="border-t border-[#1e3a5f] px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3730a3] bg-[#1e1b4b] px-4 py-1.5 text-xs text-[#818cf8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#818cf8] animate-pulse" />
              Hâlâ kararsız mısınız? Önce ücretsiz deneyin.
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-4xl text-white">Hemen Başlayın</h2>
            <p className="mb-2 text-sm text-[#9ca3af]">Ücretsiz test ile kaliteyi görün, sonra karar verin.</p>
            <p className="mb-8 text-xs text-[#6b7280]">Kredi kartı gerekmez · 12 saatlik erişim · Anında kurulum</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={() => handleOpenModal()}
                className="rounded-xl bg-[#6366f1] px-10 py-4 font-semibold text-white shadow-xl shadow-[#6366f1]/25 transition-all hover:bg-[#4f46e5] hover:scale-[1.02]">
                ⚡ Ücretsiz Test Al
              </button>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-8 py-4 font-semibold text-white transition-all hover:bg-[#1ebe5d]">
                💬 WhatsApp ile İletişim
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e3a5f] bg-[#0d1117] px-6 py-12 text-center text-sm text-[#6b7280]">
        <p className="mb-1 font-semibold text-[#818cf8]">Galya IPTV</p>
        <p className="mb-1 text-xs text-[#6b7280]">Türkiye'nin en kaliteli 4K IPTV hizmeti · 85.000+ kanal · 10.000+ aktif kullanıcı</p>
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-5 text-xs">
          <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
          <Link href="/#paketler" className="transition-colors hover:text-white">IPTV Fiyatları</Link>
          <Link href="/#yorumlar" className="transition-colors hover:text-white">Yorumlar</Link>
          <Link href="/#sss" className="transition-colors hover:text-white">S.S.S</Link>
          <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
          <Link href="/blog/iptv-nedir" className="transition-colors hover:text-white">IPTV Nedir?</Link>
          <Link href="/blog/iptv-kurulum" className="transition-colors hover:text-white">Kurulum Rehberi</Link>
        </div>
      </footer>

      {/* ─── Mobil Sticky CTA ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1e3a5f] bg-[#030712]/95 px-3 py-2 backdrop-blur-md md:hidden">
        <div className="flex gap-2">
          <button onClick={() => handleOpenModal()}
            className="flex-1 rounded-lg bg-[#6366f1] py-2 text-xs font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition-colors hover:bg-[#4f46e5]">
            ⚡ Ücretsiz Test Al
          </button>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center rounded-lg bg-[#25d366] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1ebe5d]">
            💬 WhatsApp
          </a>
        </div>
      </div>

      {/* ─── Desktop Sticky CTA ─────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:flex flex-col gap-2 items-end">
        <div className="rounded-xl border border-[#1e3a5f] bg-[#111827]/95 p-3 shadow-2xl backdrop-blur-md w-52">
          <p className="mb-2 text-[11px] text-[#818cf8] text-center">⭐ 12 aylık paket popüler</p>
          <button onClick={() => handleOpenModal()}
            className="mb-1.5 w-full rounded-lg bg-[#6366f1] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4f46e5]">
            ⚡ Ücretsiz Test Al
          </button>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-lg bg-[#25d366]/10 border border-[#25d366]/20 py-2 text-xs font-semibold text-[#25d366] transition-colors hover:bg-[#25d366]/20">
            💬 WhatsApp'a Yaz
          </a>
        </div>
      </div>

      {/* ─── Spin Popup Modal ────────────────────────────────────────────────── */}
      {showSpinPopup && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4"
          style={{ background:'rgba(3,7,18,0.8)', backdropFilter:'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSpinPopup(false); }}
        >
          <div className="relative w-full max-w-xs rounded-2xl p-5 shadow-2xl border border-[#1e3a5f] bg-[#111827]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🎡</span>
                <span className="text-sm font-bold text-white">İndirim Kazan</span>
                <span className="rounded-full bg-[#1e1b4b] px-2 py-0.5 text-[10px] font-semibold text-[#818cf8]">Sınırlı</span>
              </div>
              <button onClick={() => setShowSpinPopup(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#1e3a5f] hover:text-white text-xs">
                ✕
              </button>
            </div>
            <SpinSection onOpenModal={() => { setShowSpinPopup(false); handleOpenModal(); }}/>
          </div>
        </div>
      )}

      {/* ─── Sticky Spin Banner ─────────────────────────────────────────────── */}
      {!spinBannerDismissed && !showSpinPopup && (
        <div className="fixed bottom-20 right-4 z-40 md:bottom-[88px] md:right-6">
          <div className="relative">
            <button onClick={() => setSpinBannerDismissed(true)}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#1e3a5f] border border-[#3730a3] text-[10px] text-[#818cf8] transition-colors hover:text-white z-10">
              ✕
            </button>
            <button onClick={() => setShowSpinPopup(true)}
              className="flex items-center gap-2.5 rounded-2xl border border-[#3730a3] bg-[#111827] px-4 py-3 shadow-2xl backdrop-blur-md transition-all hover:border-[#6366f1]/50 hover:bg-[#1e1b4b]"
              style={{ boxShadow: '0 0 20px rgba(99,102,241,0.15)' }}>
              <span className="text-2xl" style={{ display:'inline-block', animation:'spin-slow 4s linear infinite' }}>🎡</span>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">İndirim Kazan!</p>
                <p className="text-[10px] text-[#818cf8] leading-tight">Çarkı çevir, ödülünü al</p>
              </div>
              <span className="relative flex h-2 w-2 ml-1">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6366f1] opacity-75"/>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6366f1]"/>
              </span>
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ─── Modal ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#030712]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="relative w-full max-w-md overflow-y-auto rounded-t-2xl bg-[#111827] border border-[#1e3a5f] p-6 shadow-2xl sm:rounded-2xl"
            style={{ maxHeight: '92vh' }}>
            <button onClick={handleCloseModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#1e3a5f] hover:text-white">
              ✕
            </button>

            <Stepper step={step} />

            {/* ── ADIM 1: Cihaz seçimi ───────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Hangi cihazda kullanacaksınız?</h3>
                  <p className="mt-1 text-sm text-[#9ca3af]">Kurulum rehberini cihazınıza göre hazırlayalım.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEVICES.map((device) => (
                    <button key={device.id} onClick={() => setSelectedDevice(device.id)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                        selectedDevice === device.id
                          ? 'border-[#6366f1]/60 bg-[#1e1b4b]'
                          : 'border-[#1e3a5f] bg-[#0d1117] hover:border-[#3730a3]'
                      }`}>
                      <span className="mb-1 text-xl">{device.icon}</span>
                      <span className="text-sm font-semibold text-white">{device.label}</span>
                      <span className="text-[11px] text-[#6b7280]">{device.sub}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1.5 as ModalStep)} disabled={!selectedDevice}
                  className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5] disabled:opacity-40">
                  Devam Et →
                </button>
                <p className="text-center text-xs text-[#6b7280]">Kredi kartı gerekmez · 12 saatlik ücretsiz erişim</p>
              </div>
            )}

            {/* ── ADIM 1.5: İzleme amacı + paket önerisi ─────────────────────── */}
            {step === (1.5 as ModalStep) && (
              <div className="space-y-3">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-[#1e3a5f] bg-[#0d1117] px-2.5 py-1 text-xs text-[#9ca3af]">
                    {DEVICES.find(d => d.id === selectedDevice)?.icon} {DEVICES.find(d => d.id === selectedDevice)?.label} seçildi
                  </div>
                  <h3 className="text-xl font-bold text-white">En çok ne izleyeceksiniz?</h3>
                  <p className="mt-1 text-sm text-[#9ca3af]">Birden fazla seçebilirsiniz.</p>
                </div>
                <div className="space-y-2">
                  {PURPOSES.map((p) => {
                    const selected = selectedPurposes.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => setSelectedPurposes(prev =>
                        prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                      )}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                          selected ? 'border-[#6366f1]/60 bg-[#1e1b4b]' : 'border-[#1e3a5f] bg-[#0d1117] hover:border-[#3730a3]'
                        }`}>
                        <span className="text-lg">{p.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{p.label}</div>
                          <div className="text-[11px] text-[#6b7280]">{p.sub}</div>
                        </div>
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${
                          selected ? 'border-[#6366f1] bg-[#6366f1] text-white' : 'border-[#1e3a5f]'
                        }`}>{selected ? '✓' : ''}</div>
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

                <button onClick={() => setStep(2)}
                  className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5]">
                  Testi Başlat →
                </button>
                <button onClick={() => setStep(1)} className="w-full text-xs text-[#6b7280] transition-colors hover:text-[#9ca3af]">← Geri dön</button>
              </div>
            )}

            {/* ── ADIM 2: Email ──────────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">E-posta Adresiniz</h3>
                  <p className="mt-1 text-sm text-[#9ca3af]">Test bilgilerini göndereceğimiz e-posta adresinizi girin.</p>
                </div>
                {selectedDevice && (
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-lg border border-[#1e3a5f] bg-[#0d1117] px-3 py-1.5 text-xs text-[#9ca3af]">
                      {DEVICES.find(d => d.id === selectedDevice)?.icon} {DEVICES.find(d => d.id === selectedDevice)?.label}
                    </div>
                    {selectedPurposes.map(pid => {
                      const p = PURPOSES.find(x => x.id === pid);
                      return p ? (
                        <div key={pid} className="rounded-lg border border-[#1e3a5f] bg-[#0d1117] px-3 py-1.5 text-xs text-[#9ca3af]">
                          {p.icon} {p.label}
                        </div>
                      ) : null;
                    })}
                    {recommendedPkg && (
                      <div className="rounded-lg border border-[#3730a3] bg-[#1e1b4b]/50 px-3 py-1.5 text-xs text-[#818cf8]">
                        ✨ Öneri: {recommendedPkg}
                      </div>
                    )}
                  </div>
                )}
                <input ref={emailInputRef} type="email" placeholder="ornek@email.com"
                  className="w-full rounded-xl border border-[#1e3a5f] bg-[#0d1117] px-4 py-3 text-sm text-white outline-none placeholder:text-[#4b5563] transition-colors focus:border-[#6366f1]/60"
                  value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()} />
                <p className="text-xs text-[#6b7280]">Geçici e-posta adresleri kabul edilmemektedir.</p>
                <button onClick={() => handleSendOtp(false)} disabled={loading}
                  className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5] disabled:opacity-50">
                  {loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                </button>
                {statusMsg && <p className="text-center text-xs text-amber-400">{statusMsg}</p>}
                <div className="flex justify-between text-xs">
                  <button onClick={() => setStep(1.5 as ModalStep)} className="text-[#6b7280] transition-colors hover:text-[#9ca3af]">← Geri dön</button>
                  <button onClick={() => handleSendOtp(true)} disabled={loading} className="text-[#818cf8] transition-colors hover:text-[#a5b4fc]">
                    Daha önce test aldım →
                  </button>
                </div>
                <div className="border-t border-[#1e3a5f] pt-3"><WaButton /></div>
              </div>
            )}

            {/* ── ADIM 3: OTP ─────────────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4 text-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Kodu Doğrula</h3>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    <span className="text-white">{email}</span> adresine gönderilen 6 haneli kodu girin.
                  </p>
                </div>

                <OTPInput value={otp} onChange={setOtp} />

                <p className="text-xs text-[#6b7280]">Spam klasörünü de kontrol edin.</p>
                {statusMsg && <p className="text-xs text-[#9ca3af]">{statusMsg}</p>}

                {isCreating ? (
                  <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1117] p-4">
                    <CreatingProgress />
                  </div>
                ) : (
                  <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}
                    className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40">
                    {loading ? 'Lütfen Bekleyin...' : 'Onayla ve Testi Aç'}
                  </button>
                )}

                {!isCreating && (
                  <div className="flex justify-between text-xs">
                    <button onClick={() => { setStep(2); setOtp(''); }} className="text-[#6b7280] transition-colors hover:text-[#9ca3af]">← Geri dön</button>
                    <button onClick={() => handleSendOtp(isRecovery)} disabled={loading || resendCooldown > 0}
                      className="text-[#818cf8] transition-colors hover:text-[#a5b4fc] disabled:text-[#4b5563]">
                      {resendCooldown > 0 ? `Tekrar gönder (${resendCooldown}s)` : 'Tekrar gönder'}
                    </button>
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
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    Bilgiler <span className="text-white">{email}</span> adresine gönderildi.
                  </p>
                </div>

                {trialCredentials && (
                  <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1117] p-4 space-y-0">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-xs font-semibold text-emerald-400">Aktif Test</span>
                      </div>
                      <Countdown startedAt={trialCredentials.startedAt} />
                    </div>

                    <div className="divide-y divide-[#1e3a5f]">
                      {[
                        { label: 'Sunucu URL', value: 'http://pro4kiptv.xyz:2086', copy: 'http://pro4kiptv.xyz:2086/' },
                        { label: 'Kullanıcı Adı', value: trialCredentials.username, copy: trialCredentials.username },
                        { label: 'Şifre', value: trialCredentials.password, copy: trialCredentials.password },
                      ].map(row => (
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

                <button onClick={() => setStep(5 as ModalStep)}
                  className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5]">
                  📲 Kurulumu Göster →
                </button>
                <WaButton label="💬 Beğendiyseniz Satın Alın" />
                <button onClick={handleCloseModal}
                  className="w-full rounded-lg border border-[#1e3a5f] py-2.5 text-sm text-[#6b7280] transition-colors hover:text-white">
                  Pencereyi Kapat
                </button>
              </div>
            )}

            {/* ── ADIM 5: Kurulum Rehberi ─────────────────────────────────────── */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white">Kurulum Rehberi</h3>
                  <p className="mt-1 text-sm text-[#9ca3af]">Adım adım cihazına kuralım</p>
                </div>

                <div className="rounded-xl border border-[#1e3a5f] bg-[#0d1117] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">📋 Ne Yapmalısınız?</p>
                  <ol className="space-y-2.5">
                    {[
                      { n: '1', text: 'Uygulamayı cihazınıza indirin', sub: selectedDevice ? INSTALL_GUIDES[selectedDevice as DeviceId]?.app : 'IPTV Smarters Pro' },
                      { n: '2', text: 'Bilgileri uygulamaya girin', sub: 'Önceki ekrandaki sunucu, kullanıcı adı ve şifre' },
                      { n: '3', text: '12 saat boyunca deneyin', sub: 'Tüm kanalları, kaliteyi ve hızı test edin' },
                      { n: '4', text: 'Memnunsan paketi al', sub: 'WhatsApp\'tan kolayca satın alabilirsin' },
                    ].map(item => (
                      <li key={item.n} className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1e1b4b] text-[10px] font-bold text-[#818cf8]">{item.n}</span>
                        <div>
                          <p className="text-xs font-medium text-white">{item.text}</p>
                          <p className="text-[11px] text-[#6b7280]">{item.sub}</p>
                        </div>
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
                        <div>
                          <p className="text-xs font-semibold text-white">Kurulum Adımları</p>
                          <p className="text-[11px] text-[#6b7280]">{guide.app}</p>
                        </div>
                      </div>
                      <ol className="space-y-2">
                        {guide.steps.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-xs text-[#9ca3af]">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1e1b4b] text-[10px] font-bold text-[#818cf8]">{i + 1}</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ol>
                      {guide.note && (
                        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-[11px] leading-relaxed text-amber-400">
                          💡 {guide.note}
                        </p>
                      )}
                    </div>
                  );
                })()}

                <WaButton label="💬 Beğendiyseniz Satın Alın" />
                <button onClick={() => setStep(4 as ModalStep)}
                  className="w-full text-xs text-[#6b7280] transition-colors hover:text-[#9ca3af]">
                  ← Test bilgilerine dön
                </button>
                <button onClick={handleCloseModal}
                  className="w-full rounded-lg border border-[#1e3a5f] py-2.5 text-sm text-[#6b7280] transition-colors hover:text-white">
                  Pencereyi Kapat
                </button>
              </div>
            )}

            {/* ── ADIM 6: Daha önce test alındı ──────────────────────────────── */}
            {step === 6 && (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-950/40 text-2xl">⏳</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Daha Önce Test Aldınız</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">{alreadyUsedMsg}</p>
                </div>
                <WaButton label="💬 WhatsApp ile Satın Al" />
                <button onClick={() => { setStep(1); setEmail(''); setAlreadyUsedMsg(''); }}
                  className="w-full text-xs text-[#818cf8] transition-colors hover:text-[#a5b4fc]">
                  Farklı e-posta ile dene
                </button>
                <button onClick={handleCloseModal} className="w-full text-xs text-[#6b7280] transition-colors hover:text-[#9ca3af]">Kapat</button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
