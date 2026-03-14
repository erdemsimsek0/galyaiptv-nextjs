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
  // Daha gerçekçi rating değerleri (Google için daha güvenilir)
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

type ModalStep = 1 | 1.5 | 2 | 3 | 4 | 5;

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
const LS_SPIN_KEY   = 'galya_spin_entries'; // { [phone]: { prizeIndex, wonAt } }
const SPIN_PRIZES = [
  { label: '%5 İndirim',      chance: 0.30, bg: '#2e2760', text: '#c4b8ff' },
  { label: '%10 İndirim',     chance: 0.25, bg: '#3d3380', text: '#d6ccff' },
  { label: '+7 Gün Ücretsiz', chance: 0.20, bg: '#25245a', text: '#a5b4fc' },
  { label: '+15 Gün Hediye',  chance: 0.15, bg: '#38286e', text: '#c084fc' },
  { label: '%20 İndirim',     chance: 0.02, bg: '#5b21b6', text: '#ffffff' },
  { label: '%8 İndirim',      chance: 0.08, bg: '#282660', text: '#c4b8ff' },
] as const;
type SpinPrize = typeof SPIN_PRIZES[number];
const SPIN_SEG_ANGLE  = 360 / SPIN_PRIZES.length;  // 60° her dilim
const SPIN_DURATION   = 5200;                        // ms
const PRIZE_VALID_MS  = 15 * 60 * 1000;             // 15 dakika

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
  if (d.length !== 10 || !d.startsWith('5'))
    return { valid: false, normalized: '', error: 'Geçerli bir GSM numarası girin (05xx xxx xx xx)' };
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
          <stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#6d28d9"/>
        </radialGradient>
      </defs>
      {/* Dış parıltı halkası */}
      <circle cx={cx} cy={cy} r={r+5} fill="none" stroke="rgba(124,111,205,0.25)" strokeWidth="9"/>
      {/* Dilimler */}
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
              fill={p.bg} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fill={p.text} fontSize="10.5" fontWeight="700" fontFamily="system-ui,sans-serif"
              transform={`rotate(${rot},${lx},${ly})`} style={{userSelect:'none'}}>
              {p.label}
            </text>
          </g>
        );
      })}
      {/* Bölme çizgileri */}
      {SPIN_PRIZES.map((_,i) => {
        const a=(i*SPIN_SEG_ANGLE-90)*Math.PI/180;
        return <line key={`l${i}`} x1={cx} y1={cy} x2={cx+r*Math.cos(a)} y2={cy+r*Math.sin(a)}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>;
      })}
      {/* Süsleme noktaları */}
      {Array.from({length:12}).map((_,i)=>{
        const a=(i*30-90)*Math.PI/180, pr=r+7;
        return <circle key={`d${i}`} cx={cx+pr*Math.cos(a)} cy={cy+pr*Math.sin(a)} r="3.5"
          fill={i%2===0?'#7c6fcd':'#a78bfa'} opacity="0.85"/>;
      })}
      {/* Merkez */}
      <circle cx={cx} cy={cy} r={inner+5} fill="rgba(0,0,0,0.45)"/>
      <circle cx={cx} cy={cy} r={inner} fill="url(#sg-cg)"/>
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="9" fontWeight="800" fontFamily="system-ui,sans-serif"
        style={{userSelect:'none'}}>ÇEVİR</text>
    </svg>
  );
}

// ─── SpinSection bileşeni (page içine gömülü) ─────────────────────────────────
function SpinSection({ onOpenModal }: { onOpenModal: () => void }) {
  type SpinPhase = 'form' | 'ready' | 'spinning' | 'result' | 'already_won';
  const [sPhone,    setPhone]    = useState('');
  const [sPhoneErr, setPhoneErr] = useState('');
  const [sNorm,     setNorm]     = useState('');
  const [sPhase,    setPhase]    = useState<SpinPhase>('form');
  const [sRot,      setRot]      = useState(0);
  const [sWonIdx,   setWonIdx]   = useState<number|null>(null);
  const [sWonAt,    setWonAt]    = useState<number|null>(null);
  const [sSound,    setSound]    = useState(true);
  const audCtx  = useRef<AudioContext|null>(null);
  const rafRef  = useRef<number|null>(null);
  const startTs = useRef<number|null>(null);
  const startRt = useRef(0);
  const targetR = useRef(0);
  const [winCount] = useState(() => 128 + Math.floor(Math.random()*40));

  // Countdown
  const expiresAt = sWonAt ? sWonAt + PRIZE_VALID_MS : null;
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const expired = remaining === 0 && expiresAt !== null;

  // Ses
  const playTick = useCallback(() => {
    if (!sSound) return;
    try {
      if (!audCtx.current) audCtx.current = new (window.AudioContext||(window as any).webkitAudioContext)();
      const ctx=audCtx.current, o=ctx.createOscillator(), g=ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value=700+Math.random()*500;
      g.gain.setValueAtTime(0.06,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.04);
      o.start(); o.stop(ctx.currentTime+0.04);
    } catch {}
  }, [sSound]);

  const playWin = useCallback(() => {
    if (!sSound) return;
    try {
      if (!audCtx.current) audCtx.current = new (window.AudioContext||(window as any).webkitAudioContext)();
      const ctx=audCtx.current;
      [523,659,784,1047].forEach((f,i) => {
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value=f;
        g.gain.setValueAtTime(0,ctx.currentTime+i*0.13);
        g.gain.linearRampToValueAtTime(0.14,ctx.currentTime+i*0.13+0.05);
        g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.13+0.32);
        o.start(ctx.currentTime+i*0.13); o.stop(ctx.currentTime+i*0.13+0.35);
      });
    } catch {}
  }, [sSound]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

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
    // IP kontrolü — backend entegrasyonu:
    // const res = await fetch('/api/spin/check', {method:'POST',body:JSON.stringify({phone:normalized})});
    // const d = await res.json(); if (d.used) { setPhase('already_won'); return; }
    setPhase('ready');
  }

  function startSpin() {
    const idx = spinPickPrize();
    const BASE_TURNS = 6;
    const center = idx * SPIN_SEG_ANGLE + SPIN_SEG_ANGLE / 2;
    const stop   = 360 - center + 90;
    const total  = BASE_TURNS * 360 + (stop % 360);
    startRt.current = sRot % 360;
    targetR.current = sRot + total;
    setWonIdx(idx); setPhase('spinning');
    startTs.current = null;
    let lastSeg = 0;

    function animate(ts: number) {
      if (!startTs.current) startTs.current = ts;
      const elapsed = ts - startTs.current;
      const prog = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = spinEaseOut(prog);
      const cur = startRt.current + eased * total;
      setRot(cur);
      const curSeg = Math.floor((cur % 360) / SPIN_SEG_ANGLE);
      if (curSeg !== lastSeg) { playTick(); lastSeg = curSeg; }
      if (prog < 1) { rafRef.current = requestAnimationFrame(animate); }
      else {
        setRot(targetR.current % 360);
        const now = Date.now();
        setWonAt(now);
        spinSaveEntry(sNorm, { prizeIndex: idx, wonAt: now });
        // Backend kayıt — entegrasyon:
        // fetch('/api/spin/record',{method:'POST',headers:{'Content-Type':'application/json'},
        //   body:JSON.stringify({phone:sNorm,prizeIndex:idx,wonAt:now})});
        playWin(); setPhase('result');
      }
    }
    rafRef.current = requestAnimationFrame(animate);
  }

  const wonPrize: SpinPrize | null = sWonIdx !== null ? SPIN_PRIZES[sWonIdx] : null;
  const waUrl = wonPrize ? spinBuildWaUrl(wonPrize.label) : WHATSAPP_URL;

  // ─── Sonuç / CTA ortak parçası ─────────────────────────────────────────────
  const ResultBlock = () => wonPrize ? (
    <div className="space-y-3 mt-4">
      {/* Kazanılan ödül kutusu */}
      <div className={`rounded-xl border p-5 text-center transition-all ${
        expired
          ? 'border-white/[0.06] bg-[#1a1a22] opacity-50'
          : 'border-[#7c6fcd]/40 bg-gradient-to-b from-[#7c6fcd]/20 to-[#7c6fcd]/[0.04]'
      }`}>
        <div className="text-3xl mb-2">🏆</div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#a78bfa] mb-1">
          {expired ? 'Ödül Süresi Doldu' : 'Tebrikler! Kazandın:'}
        </p>
        <p className={`text-3xl font-extrabold tracking-tight ${expired ? 'text-[#4b4860]' : 'text-white'}`}>
          {wonPrize.label}
        </p>
      </div>

      {/* Countdown */}
      {!expired && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
          <span className="text-base">⏱</span>
          <span className="text-sm text-amber-400">
            Bu ödül <strong>{spinFmtCountdown(remaining)}</strong> içinde kullanılabilir
          </span>
        </div>
      )}

      {/* CTA butonları */}
      {!expired ? (
        <div className="space-y-2">
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-[#1ebe5d] active:scale-[0.98]">
            💬 WhatsApp&apos;tan Kullan
          </a>
          <button onClick={onOpenModal}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c6fcd] to-[#6d28d9] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#7c6fcd]/20 transition-all hover:opacity-90 active:scale-[0.98]">
            🛒 Kazandığın Ödüyle Ücretsiz Test Al
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-white/[0.06] bg-[#22222c] p-4 text-center">
          <p className="mb-3 text-sm text-[#9b98b0]">Ödül süresi doldu — paketler hâlâ uygun fiyatlı!</p>
          <a href="/#paketler"
            className="inline-flex items-center gap-1 rounded-lg bg-[#7c6fcd]/20 px-4 py-2 text-sm font-semibold text-[#a78bfa] transition-colors hover:bg-[#7c6fcd]/30">
            Paketlere Git →
          </a>
        </div>
      )}
      <p className="text-center text-[11px] text-[#4b4860]">
        Ödülünüzü WhatsApp mesajında göstererek kullanabilirsiniz.
      </p>
    </div>
  ) : null;

  return (
    <section className="relative border-t border-white/[0.08] overflow-hidden px-4 py-16 sm:px-6">
      {/* Arka plan efektleri */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[350px] w-[550px] rounded-full bg-[#7c6fcd]/7 blur-3xl"/>
        <div className="absolute bottom-0 right-0 h-[250px] w-[250px] rounded-full bg-[#6d28d9]/5 blur-3xl"/>
      </div>

      <div className="relative mx-auto max-w-2xl">
        {/* Başlık */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#7c6fcd]/30 bg-[#7c6fcd]/10 px-4 py-1.5 text-xs font-semibold text-[#a78bfa]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a78bfa]"/>
            Sınırlı Süre Kampanyası
          </div>
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            🎡 Çevir, Kazan!
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[#9b98b0]">
            WhatsApp numaranı gir, çarkı bir kez çevir ve özel indirimini kap.{' '}
            <span className="font-semibold text-[#a78bfa]">Her numara sadece 1 hak.</span>
          </p>
        </div>

        {/* Kazanan sayacı + ses */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
            </span>
            <span className="text-xs text-emerald-400">
              Bugün <strong>{winCount} kişi</strong> ödül kazandı
            </span>
          </div>
          <button onClick={() => setSound(v=>!v)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-[#22222c] text-sm text-[#9b98b0] transition-colors hover:text-white"
            title={sSound ? 'Sesi kapat' : 'Sesi aç'}>
            {sSound ? '🔊' : '🔇'}
          </button>
        </div>

        {/* Ana kart */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#141418] p-6 shadow-2xl">

          {/* FORM */}
          {sPhase === 'form' && (
            <div className="space-y-5">
              {/* Ödül şeridi */}
              <div className="flex flex-wrap gap-2 justify-center">
                {SPIN_PRIZES.map((p,i) => (
                  <span key={i} className="rounded-full border border-[#7c6fcd]/20 bg-[#7c6fcd]/10 px-3 py-1 text-xs font-semibold text-[#c4b8ff]">
                    {p.label}
                  </span>
                ))}
              </div>

              <div className="rounded-xl border border-[#7c6fcd]/15 bg-[#7c6fcd]/5 p-4 text-center">
                <p className="text-sm text-[#9b98b0]">
                  ✨ Çarkı çevirmek için WhatsApp numaranı gir.{' '}
                  <span className="text-xs text-[#6b6880]">Numaran hiçbir amaçla paylaşılmaz.</span>
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#9b98b0]">WhatsApp Numaranız</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#22222c] px-3 py-2.5 text-sm text-[#9b98b0] whitespace-nowrap">
                    🇹🇷 +90
                  </div>
                  <input type="tel" inputMode="numeric" placeholder="05xx xxx xx xx"
                    value={sPhone}
                    onChange={e => { setPhone(spinFormatPhone(e.target.value)); setPhoneErr(''); }}
                    onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
                    className="flex-1 rounded-lg border border-white/[0.08] bg-[#22222c] px-3 py-2.5 text-sm text-[#f1f0f5] placeholder-[#4b4860] outline-none transition-colors focus:border-[#7c6fcd]/50 focus:ring-1 focus:ring-[#7c6fcd]/30"/>
                </div>
                {sPhoneErr && <p className="mt-1.5 text-xs text-red-400">{sPhoneErr}</p>}
              </div>

              <button onClick={handlePhoneSubmit}
                className="w-full rounded-xl bg-gradient-to-r from-[#7c6fcd] to-[#6d28d9] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#7c6fcd]/25 transition-all hover:opacity-90 active:scale-[0.98]">
                🎡 Çarkı Çevirmek İstiyorum
              </button>
              <p className="text-center text-[11px] text-[#4b4860]">
                Her numara yalnızca 1 kez katılabilir. Ödül 15 dakika geçerlidir.
              </p>
            </div>
          )}

          {/* ÇARK ALANI (ready / spinning / result) */}
          {(sPhase === 'ready' || sPhase === 'spinning' || sPhase === 'result') && (
            <div className="space-y-5">
              {/* Çark */}
              <div className="relative mx-auto flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
                {/* Gösterge (pointer) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 flex flex-col items-center">
                  <div className="w-0 h-0" style={{
                    borderLeft:'10px solid transparent', borderRight:'10px solid transparent',
                    borderTop:'22px solid #a78bfa',
                    filter:'drop-shadow(0 2px 6px rgba(167,139,250,0.6))',
                  }}/>
                </div>
                <SpinWheelSVG rotation={sRot}/>
              </div>

              {sPhase === 'ready' && (
                <div className="space-y-3">
                  <p className="text-center text-sm text-[#9b98b0]">Hazırsın! Çarkı çevir ve ödülünü kazan.</p>
                  <button onClick={startSpin}
                    className="w-full rounded-xl bg-gradient-to-r from-[#7c6fcd] to-[#6d28d9] py-4 text-base font-bold text-white shadow-lg shadow-[#7c6fcd]/30 transition-all hover:opacity-90 active:scale-[0.98]">
                    🎯 ÇARKI ÇEVİR!
                  </button>
                </div>
              )}

              {sPhase === 'spinning' && (
                <p className="text-center text-sm font-semibold text-[#a78bfa] animate-pulse">⏳ Çark dönüyor...</p>
              )}

              {sPhase === 'result' && <ResultBlock/>}
            </div>
          )}

          {/* DAHA ÖNCE KAZANILDI */}
          {sPhase === 'already_won' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                <div className="mb-2 text-2xl">⚠️</div>
                <p className="text-sm font-semibold text-amber-400">Bu numara daha önce kampanyaya katıldı</p>
                <p className="mt-1 text-xs text-[#9b98b0]">Daha önce kazandığın ödül aşağıda gösterilmektedir.</p>
              </div>
              <ResultBlock/>
              <button onClick={() => { setPhone(''); setNorm(''); setPhase('form'); setPhoneErr(''); }}
                className="w-full rounded-lg border border-white/[0.08] py-2.5 text-xs text-[#6b6880] transition-colors hover:text-[#9b98b0]">
                Farklı numara ile dene
              </button>
            </div>
          )}
        </div>

        {/* Referans kartı */}
        <div className="mt-4 rounded-xl border border-[#7c6fcd]/20 bg-gradient-to-r from-[#7c6fcd]/10 to-pink-900/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7c6fcd]/20 text-xl">👥</div>
            <div className="flex-1">
              <p className="mb-0.5 text-sm font-bold text-white">Arkadaşına Öner, +3 Ay Kazan!</p>
              <p className="mb-3 text-xs leading-relaxed text-[#9b98b0]">
                Arkadaşın Galya IPTV&apos;ye üye olursa{' '}
                <span className="font-semibold text-[#a78bfa]">+3 ay ücretsiz uzatma</span> hakkı kazanırsın.
              </p>
              <a href={`${WHATSAPP_BASE}?text=${encodeURIComponent('Merhaba, referans programı hakkında bilgi almak istiyorum.')}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#7c6fcd]/30 bg-[#7c6fcd]/10 px-3 py-1.5 text-xs font-semibold text-[#a78bfa] transition-colors hover:bg-[#7c6fcd]/20">
                💬 Referans Kodumu Al
              </a>
            </div>
          </div>
        </div>

        {/* Güven çubuğu */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {[
            { icon:'🔒', text:'Tek Kullanım Hakkı' },
            { icon:'⏱', text:'15 Dk Geçerli' },
            { icon:'📞', text:'7/24 WhatsApp Destek' },
            { icon:'✅', text:'Ücretsiz Test' },
          ].map((item,i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-[#141418] px-3 py-1.5 text-xs text-[#9b98b0]">
              <span>{item.icon}</span><span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
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
            t.type === 'success' ? 'border-emerald-700/50 bg-emerald-950/90 text-emerald-300' :
            t.type === 'error'   ? 'border-red-700/50 bg-red-950/90 text-red-300' :
            t.type === 'warning' ? 'border-amber-700/50 bg-amber-950/90 text-amber-300' :
                                   'border-[#7c6fcd]/40 bg-[#18181f]/95 text-[#c0bdd6]'
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
          className={`h-12 w-10 rounded-xl border bg-white/[0.05] text-center font-mono text-xl font-bold text-white outline-none transition-all ${
            value[i] ? 'border-[#7c6fcd]/60 bg-[#7c6fcd]/10' : 'border-white/[0.08] focus:border-[#7c6fcd]/40'
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
        copied ? 'border-emerald-600 text-emerald-400' : 'border-white/[0.08] text-[#9b98b0] hover:border-[#7c6fcd]/50 hover:text-[#7c6fcd]'
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
    <div className="flex items-center gap-1 rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-2.5 py-1.5">
      {[{ val: pad(h), label: 'sa' }, { val: pad(m), label: 'dk' }, { val: pad(s), label: 'sn' }].map((block, i) => (
        <span key={block.label} className="flex items-center gap-1">
          {i > 0 && <span className="mb-2 text-xs font-bold text-emerald-900">:</span>}
          <span className="flex flex-col items-center">
            <span className="font-mono text-base font-bold leading-none text-emerald-400">{block.val}</span>
            <span className="text-[9px] uppercase tracking-wider text-emerald-900">{block.label}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
const STEP_LABELS = ['Cihaz', 'E-posta', 'Doğrula', 'Hazır'];
function Stepper({ step }: { step: ModalStep }) {
  const active = step === 1 ? 1 : step === 1.5 ? 1 : Math.min(step as number, 4);
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
                done ? 'bg-[#7c6fcd] text-white' : current ? 'border-2 border-[#7c6fcd] text-[#7c6fcd]' : 'border border-white/[0.08] text-[#6b6880]'
              }`}>
                {done ? '✓' : idx}
              </span>
              <span className={`text-[9px] ${current ? 'text-[#7c6fcd]' : done ? 'text-[#9b98b0]' : 'text-[#c0bdd6]'}`}>{label}</span>
            </span>
            {i < STEP_LABELS.length - 1 && <span className={`mb-4 h-px w-8 ${done ? 'bg-[#7c6fcd]' : 'bg-white/[0.05]'}`} />}
          </span>
        );
      })}
    </div>
  );
}

// ─── Progress Bar (test oluşturma) ────────────────────────────────────────────
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
        <span className="text-[#9b98b0]">{statuses[statusIndex]}</span>
        <span className="font-mono text-[#7c6fcd]">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#7c6fcd] to-[#7c6fcd] transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-center text-[11px] text-[#9b98b0]">Bu işlem 30–40 saniye sürebilir, lütfen bekleyin.</p>
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
  const toastIdRef = useRef(0);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // ─── Toast yardımcıları ──────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ─── Cooldown sayacı ─────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 2) setTimeout(() => emailInputRef.current?.focus(), 100);
  }, [step]);

  // ─── Paket önerisi: cihaz + amaç seçilince otomatik hesapla ─────────────
  useEffect(() => {
    if (selectedDevice && selectedPurposes.length > 0) {
      setRecommendedPkg(getRecommendedPackage(selectedDevice, selectedPurposes));
    }
  }, [selectedDevice, selectedPurposes]);

  // ─── Exit-intent ─────────────────────────────────────────────────────────
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

  // ─── Modal açma: localStorage'dan ilerlemeyi yükle ────────────────────────
  const handleOpenModal = (pkg?: string) => {
    // localStorage'dan önceki seçimi yükle
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.device) setSelectedDevice(parsed.device);
        if (parsed.purposes) setSelectedPurposes(parsed.purposes);
        if (parsed.email) setEmail(parsed.email);
      } else {
        setSelectedDevice('');
        setSelectedPurposes([]);
        setEmail('');
      }
    } catch {
      setSelectedDevice('');
      setSelectedPurposes([]);
      setEmail('');
    }
    setIsModalOpen(true);
    setStep(1);
    setSelectedPackage(pkg || '');
    setOtp(''); setOtpToken('');
    setStatusMsg(''); setAlreadyUsedMsg('');
    setResendCooldown(0); setIsRecovery(false);
    setTrialCredentials(null); setIsCreating(false);
  };

  // ─── Modal kapama: localStorage'a kaydet ─────────────────────────────────
  const handleCloseModal = () => {
    // Tamamlanmamış seçimi sakla (adım 4'e ulaşmamışsa)
    if (step !== 4) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          device: selectedDevice,
          purposes: selectedPurposes,
          email,
        }));
      } catch { /* ignore */ }
    } else {
      try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
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
        else { setAlreadyUsedMsg(data.error); setStep(5); return; }
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
      if (data.alreadyUsed) { setAlreadyUsedMsg(data.error); setStep(5); setStatusMsg(''); setIsCreating(false); return; }
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
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 font-semibold text-white transition-colors hover:bg-[#1ebe5d]">
      {label}
    </a>
  );

  // Paket karşılaştırma tablosu
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
      {/* Schema Markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      {/* ─── Toast bildirimleri ──────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ─── Exit-intent popup ───────────────────────────────────────────────── */}
      {showExitPopup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-[#7c6fcd]/30 bg-[#1c1c25] p-6 text-center shadow-2xl">
            <button onClick={() => setShowExitPopup(false)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[#6b6880] transition-colors hover:bg-white/[0.06] hover:text-white">✕</button>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#7c6fcd]/15 text-2xl">🎁</div>
            <h3 className="mb-1 text-lg font-bold text-white">Gitmeden önce bir dakika!</h3>
            <p className="mb-4 text-sm text-[#9b98b0]">12 saatlik <strong className="text-white">ücretsiz test</strong> hesabı açılsın mı? Kredi kartı gerekmez.</p>
            <button onClick={() => { setShowExitPopup(false); handleOpenModal(); }}
              className="mb-2 w-full rounded-xl bg-[#7c6fcd] py-3 font-semibold text-white transition-colors hover:bg-[#6358b8]">
              ⚡ Evet, Ücretsiz Test Al
            </button>
            <button onClick={() => setShowExitPopup(false)} className="text-xs text-[#6b6880] transition-colors hover:text-[#9b98b0]">
              Hayır, teşekkürler
            </button>
          </div>
        </div>
      )}

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#18181f]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#f1f0f5]">
            Galya <span className="text-[#7c6fcd]">IPTV</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-7 text-sm text-[#9b98b0] md:flex">
            <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
            <Link href="/#yorumlar" className="transition-colors hover:text-white">Yorumlar</Link>
            <Link href="/#neden-biz" className="transition-colors hover:text-white">Neden Biz</Link>
            <Link href="/#sss" className="transition-colors hover:text-white">S.S.S</Link>
            <Link href="/araclar" className="transition-colors hover:text-white">Araçlar</Link>
            <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
            <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
            <button onClick={() => handleOpenModal()}
              className="rounded-lg border border-[#7c6fcd]/40 bg-[#7c6fcd]/10 px-4 py-2 text-sm font-medium text-[#7c6fcd] transition-all hover:bg-[#7c6fcd]/20 hover:text-white">
              Ücretsiz Test
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button className="flex flex-col gap-1.5 p-2 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menüyü aç">
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/[0.08] bg-[#18181f] px-6 pb-4 md:hidden">
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
                  className="rounded-lg px-3 py-2.5 text-[#9b98b0] transition-colors hover:bg-white/[0.05] hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="bg-[#18181f] text-[#f1f0f5]">

        {/* ─── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-[#7c6fcd]/6 blur-3xl" />
          <div className="relative mx-auto max-w-4xl">

            {/* Canlı aciliyet rozeti */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#22222c] px-4 py-1.5 text-xs text-[#9b98b0]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Bu ay <span className="text-[#f1f0f5] font-medium mx-1">847 kişi</span> satın aldı · 4K Yayın · 85.000+ Kanal
            </div>

            <h1 className="mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              IPTV Satın Al –<br />
              <span className="text-[#7c6fcd]">4K Kalite, 85.000+ Kanal</span>
            </h1>

            <p className="mx-auto mb-4 max-w-2xl text-base leading-relaxed text-[#9b98b0] md:text-lg">
              En iyi IPTV server ile canlı TV, spor, film ve dizi — tek üyelikle tüm cihazlarda.
              ₺500'den başlayan fiyatlarla, <strong className="text-[#6358b8] font-medium">ücretsiz test</strong> ile başla.
            </p>

            <p className="mb-8 text-xs text-[#9b98b0]">
              Kredi kartı gerektirmez · 12 saatlik ücretsiz erişim · Anında kurulum
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={() => handleOpenModal()}
                className="w-full sm:w-auto rounded-xl bg-[#7c6fcd] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#7c6fcd]/25 transition-all hover:bg-[#6358b8] hover:shadow-[#7c6fcd]/40 hover:scale-[1.02]">
                ⚡ Ücretsiz Test Al
              </button>
              <Link href="/#paketler"
                className="w-full sm:w-auto rounded-xl border border-white/[0.08] px-8 py-4 text-base font-semibold text-[#f1f0f5] transition-all hover:bg-white/[0.05] hover:text-white hover:border-white/20">
                IPTV Fiyatlarına Bak →
              </Link>
            </div>

            {/* Sosyal kanıt şeridi */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#9b98b0]">
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> 10.000+ mutlu kullanıcı</span>
              <span className="hidden sm:block text-[#c0bdd6]">|</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> %99.9 uptime garantisi</span>
              <span className="hidden sm:block text-[#c0bdd6]">|</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> 7/24 teknik destek</span>
              <span className="hidden sm:block text-[#c0bdd6]">|</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Anında kurulum</span>
            </div>

            {/* Canlı bilgi kartları */}
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { v: '85.000+', l: 'Canlı Kanal' },
                { v: '4K / FHD', l: 'Görüntü Kalitesi' },
                { v: '10.000+', l: 'Aktif Kullanıcı' },
                { v: '7/24', l: 'Teknik Destek' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/[0.08] bg-[#141418] p-4 text-left transition-colors hover:border-white/[0.08]">
                  <div className="text-lg font-bold text-[#f1f0f5]">{s.v}</div>
                  <div className="mt-0.5 text-xs text-[#9b98b0]">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── "Neden test almalıyım?" mini blok ─────────────────────────────── */}
        <section className="border-t border-white/[0.08] px-6 py-10">
          <div className="mx-auto max-w-3xl">
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-[#7c6fcd]">Neden Önce Test Almalısınız?</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: '🔍', title: 'Kaliteyi Önce Görün', desc: 'Satın almadan önce yayın kalitesini ve kanal sayısını bizzat test edin.' },
                { icon: '📱', title: 'Cihaz Uyumluluğunu Deneyin', desc: 'Kendi cihazınızda çalışıp çalışmadığını önceden doğrulayın.' },
                { icon: '❄️', title: 'Donma Performansını Kontrol Edin', desc: 'İnternet hızınızla uyumlu mu? Test ederek emin olun.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-[#141418] p-4">
                  <span className="mt-0.5 text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#9b98b0]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 text-center">
              <button onClick={() => handleOpenModal()}
                className="rounded-xl bg-[#7c6fcd]/10 border border-[#7c6fcd]/30 px-6 py-2.5 text-sm font-semibold text-[#7c6fcd] transition-all hover:bg-[#7c6fcd]/20">
                ⚡ Ücretsiz Testi Başlat
              </button>
            </div>
          </div>
        </section>

        {/* ─── Güven rozetleri şeridi ─────────────────────────────────────────── */}
        <section className="border-y border-white/[0.08] bg-white/[0.01] px-6 py-5">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: '🔒', label: 'SSL Güvenli' },
              { icon: '💬', label: 'WhatsApp Destek' },
              { icon: '🆓', label: 'Ücretsiz Test' },
              { icon: '⚡', label: 'Anında Kurulum' },
              { icon: '🛡️', label: 'Gizlilik Korumalı' },
              { icon: '↩️', label: 'Sorun Çözme Garantisi' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs text-[#9b98b0]">
                <span className="text-base">{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Packages ──────────────────────────────────────────────────────── */}
        <section id="paketler" className="border-t border-white/[0.08] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">IPTV Paket Fiyatları</h2>
              <p className="mt-3 text-sm text-[#9b98b0]">Tek seferlik ödeme, abonelik yok. Uzun vadede büyük tasarruf.</p>
            </div>

            {/* Paket karşılaştırma toggle */}
            <div className="mb-8 text-center">
              <button onClick={() => setShowCompare(!showCompare)}
                className="rounded-lg border border-white/[0.08] bg-[#18181f] px-4 py-2 text-xs font-medium text-[#9b98b0] transition-all hover:border-white/20 hover:text-white">
                {showCompare ? '▲ Tabloyu Gizle' : '⇄ Paketleri Karşılaştır'}
              </button>
            </div>

            {/* Karşılaştırma tablosu */}
            {showCompare && (
              <div className="mb-10 overflow-x-auto rounded-2xl border border-white/[0.08]">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-[#18181f]">
                      <th className="px-4 py-3 text-left font-medium text-[#9b98b0]">Özellik</th>
                      {packages.map((p) => (
                        <th key={p.name} className={`px-3 py-3 text-center font-semibold ${p.popular ? 'text-[#7c6fcd]' : 'text-[#f1f0f5]'}`}>
                          {p.name.replace(' Paket', '')}
                          {p.popular && <span className="ml-1 text-[10px] text-[#7c6fcd]">★</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row, ri) => (
                      <tr key={row.label} className={`border-b border-white/[0.08] ${ri % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-4 py-2.5 text-[#9b98b0]">{row.label}</td>
                        {row.values.map((val, vi) => (
                          <td key={vi} className={`px-3 py-2.5 text-center ${
                            packages[vi]?.popular ? 'text-[#7c6fcd] font-semibold'
                            : val === '✗' ? 'text-[#6b6880]'
                            : val === '✓' ? 'text-emerald-400'
                            : 'text-[#f1f0f5]'
                          }`}>{val}</td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-[#22222c]">
                      <td className="px-4 py-3 font-medium text-[#9b98b0]">Toplam Fiyat</td>
                      {packages.map((p) => (
                        <td key={p.name} className={`px-3 py-3 text-center font-bold ${p.popular ? 'text-[#6358b8]' : 'text-[#f1f0f5]'}`}>
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
                      ? 'border-[#7c6fcd]/60 bg-gradient-to-b from-[#7c6fcd]/10 to-[#7c6fcd]/[0.03] shadow-xl shadow-[#7c6fcd]/10'
                      : 'border-white/[0.08] bg-[#141418] hover:border-white/15 hover:bg-[#22222c]'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#7c6fcd] to-[#7c6fcd] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#7c6fcd]/30">
                      ⭐ En Çok Tercih Edilen
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-[#9b98b0]">{pkg.duration}</div>
                    <h3 className="mt-1.5 text-lg font-bold text-[#f1f0f5]">{pkg.name}</h3>
                    {/* "Kim için?" etiketi */}
                    <span className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      pkg.popular ? 'bg-[#7c6fcd]/15 text-[#7c6fcd]' : 'bg-white/[0.05] text-[#9b98b0]'
                    }`}>
                      {pkg.forWho}
                    </span>
                  </div>

                  {/* Fiyat + aylık maliyet + tasarruf */}
                  <div className="mb-2">
                    <span className="text-4xl font-extrabold text-[#f1f0f5]">₺{pkg.price}</span>
                    <span className="ml-1.5 text-sm text-[#9b98b0]">tek ödeme</span>
                  </div>
                  {pkg.monthlyPrice ? (
                    <div className="mb-5 flex items-center gap-2">
                      <span className="text-xs text-[#9b98b0]">
                        Aylık yalnızca <span className={`font-semibold ${pkg.popular ? 'text-[#7c6fcd]' : 'text-[#f1f0f5]'}`}>₺{pkg.monthlyPrice}</span>
                      </span>
                      {pkg.saving && (
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${pkg.popular ? 'bg-[#7c6fcd]/20 text-[#7c6fcd]' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {pkg.saving} tasarruf
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mb-5 text-xs text-[#9b98b0]">Ömür boyu tek ödeme</div>
                  )}

                  <ul className="mb-6 flex-1 space-y-2.5">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-[#9b98b0]">
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${pkg.popular ? 'bg-[#7c6fcd]/20 text-[#7c6fcd]' : 'bg-emerald-500/10 text-emerald-400'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <a href={`https://wa.me/447441921660?text=Merhaba%2C%20${encodeURIComponent(pkg.name)}%20sat%C4%B1n%20almak%20istiyorum.`}
                    target="_blank" rel="noopener noreferrer"
                    className={`mb-3 flex w-full items-center justify-center rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                      pkg.popular
                        ? 'bg-[#7c6fcd] text-white shadow-md shadow-[#7c6fcd]/25 hover:bg-[#6358b8] hover:shadow-[#7c6fcd]/40'
                        : 'border border-white/15 bg-[#22222c] text-white hover:bg-white/[0.08] hover:border-white/25'
                    }`}>
                    💬 WhatsApp ile Satın Al
                  </a>
                  <button onClick={() => handleOpenModal(pkg.name)}
                    className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-[#18181f] px-3 py-2.5 text-xs font-medium text-white transition-all hover:border-white/30 hover:bg-[#22222c]">
                    Önce Ücretsiz Test Al
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-[#9b98b0]">
              💳 Ödeme WhatsApp üzerinden güvenli şekilde gerçekleşir · Kurulum desteği dahil · Sorun yaşarsanız çözüm garantisi
            </p>
          </div>
        </section>

        {/* ─── Müşteri Yorumları ──────────────────────────────────────────────── */}
        <section id="yorumlar" className="border-t border-white/[0.08] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Müşteri Yorumları</h2>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Stars count={5} />
                <span className="text-sm text-[#9b98b0]">10.000+ kullanıcı · Ortalama <strong className="text-[#f1f0f5]">4.9</strong>/5</span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <div key={r.initials} className="rounded-2xl border border-white/[0.08] bg-[#141418] p-5 transition-all hover:border-white/15 hover:bg-[#22222c]">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7c6fcd]/20 text-sm font-bold text-[#7c6fcd]">
                        {r.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{r.name}</div>
                        <div className="text-xs text-[#9b98b0]">{r.city}</div>
                      </div>
                    </div>
                    <Stars count={r.stars} />
                  </div>
                  <p className="text-sm leading-relaxed text-[#9b98b0]">"{r.text}"</p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="mb-4 text-sm text-[#9b98b0]">Siz de denemek ister misiniz? Önce ücretsiz test alın.</p>
              <button onClick={() => handleOpenModal()}
                className="rounded-xl bg-[#7c6fcd] px-8 py-3.5 font-semibold text-white shadow-lg shadow-[#7c6fcd]/20 transition-all hover:bg-[#6358b8] hover:scale-[1.02]">
                Ücretsiz Test Al →
              </button>
            </div>
          </div>
        </section>

        {/* ─── Neden Biz ─────────────────────────────────────────────────────── */}
        <section id="neden-biz" className="border-t border-white/[0.08] px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">Neden Galya IPTV?</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: '📺', title: 'Geniş İçerik', desc: 'Canlı TV, spor, belgesel, film ve dizi kategorilerinde 85.000+ kanal.' },
                { icon: '🎯', title: '4K ve Full HD', desc: 'Destekleyen cihazlarda daha net, daha keskin izleme deneyimi.' },
                { icon: '⚡', title: '%99.9 Uptime', desc: 'Güçlü altyapı ve optimize edilmiş yayın yapısı ile stabil bağlantı.' },
                { icon: '🛡️', title: 'Kurulum Yardımı', desc: 'Satın alma sonrası WhatsApp üzerinden adım adım kurulum desteği.' },
                { icon: '📱', title: 'Tüm Cihazlar', desc: 'Smart TV, mobil, TV Box, bilgisayar, Apple TV ve daha fazlası.' },
                { icon: '🆓', title: 'Önce Test Et', desc: 'Kredi kartı gerekmez. Satın almadan 12 saatlik ücretsiz test al.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/[0.08] bg-[#22222c] p-5 transition-all hover:border-white/[0.08] hover:bg-white/[0.035]">
                  <div className="mb-3 text-2xl">{item.icon}</div>
                  <h3 className="mb-1.5 font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#9b98b0]">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <button onClick={() => handleOpenModal()}
                className="rounded-xl border border-white/15 bg-[#22222c] px-8 py-3.5 font-semibold text-white transition-all hover:bg-white/[0.08]">
                Hemen Test Al →
              </button>
            </div>
          </div>
        </section>

        {/* ─── Spin-to-Win Çark Bölümü ────────────────────────────────────────── */}
        <SpinSection onOpenModal={handleOpenModal}/>

        {/* ─── Satın alma itirazlarını kıran bölüm ───────────────────────────── */}
        <section className="border-t border-white/[0.08] px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#7c6fcd]">Aklınızdaki Soruları Biliyoruz</p>
            <h2 className="mb-8 text-center text-2xl font-bold tracking-tight md:text-3xl">Endişelerinizi Gideriyoruz</h2>
            <div className="space-y-3">
              {[
                { concern: 'Donma sorunu olur mu?', answer: 'Testte bizzat deneyin. Altyapımız %99.9 uptime garantisi verir.' },
                { concern: 'Kurulum bilmiyorum.', answer: 'Endişelenmeyin — satın alma sonrası WhatsApp\'tan adım adım yardım sağlıyoruz.' },
                { concern: 'Cihazımda çalışır mı?', answer: 'Ücretsiz test ile kendi cihazınızda önce deneyin, sonra karar verin.' },
                { concern: 'Param boşa giderse?', answer: 'Sorun yaşarsanız destek hattımız çözüm garantisi verir.' },
              ].map((item) => (
                <div key={item.concern} className="flex items-start gap-4 rounded-xl border border-white/[0.08] bg-[#141418] px-5 py-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c6fcd]/15 text-[11px] font-bold text-[#7c6fcd]">?</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.concern}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#9b98b0]">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SSS ───────────────────────────────────────────────────────────── */}
        <section id="sss" className="border-t border-white/[0.08] px-6 py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-3 text-center text-3xl font-bold tracking-tight md:text-4xl">Sıkça Sorulan Sorular</h2>
            <p className="mb-10 text-center text-sm text-[#9b98b0]">IPTV satın almadan önce merak ettikleriniz</p>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-white/[0.08] bg-[#22222c] px-5 py-4 transition-colors hover:border-white/[0.08]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-zinc-200">
                    {faq.q}
                    <span className="shrink-0 text-[10px] text-[#6b6880] transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[#9b98b0]">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Final ─────────────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.08] px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#7c6fcd]/30 bg-[#7c6fcd]/8 px-4 py-1.5 text-xs text-[#7c6fcd]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7c6fcd] animate-pulse" />
              Hâlâ kararsız mısınız? Önce ücretsiz deneyin.
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-4xl">Hemen Başlayın</h2>
            <p className="mb-2 text-sm text-[#9b98b0]">Ücretsiz test ile kaliteyi görün, sonra karar verin.</p>
            <p className="mb-8 text-xs text-[#6b6880]">Kredi kartı gerekmez · 12 saatlik erişim · Anında kurulum</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={() => handleOpenModal()}
                className="rounded-xl bg-[#7c6fcd] px-10 py-4 font-semibold text-white shadow-xl shadow-[#7c6fcd]/25 transition-all hover:bg-[#6358b8] hover:scale-[1.02]">
                ⚡ Ücretsiz Test Al
              </button>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-10 py-4 font-semibold text-white transition-all hover:bg-[#1ebe5d]">
                💬 WhatsApp ile İletişim
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#141418] px-6 py-12 text-center text-sm text-[#6b6880]">
        <p className="mb-1 font-semibold text-[#9b98b0]">Galya IPTV</p>
        <p className="mb-1 text-xs text-[#6b6880]">Türkiye'nin en kaliteli 4K IPTV hizmeti · 85.000+ kanal · 10.000+ aktif kullanıcı</p>
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-5 text-xs">
          <Link href="/blog" className="transition-colors hover:text-[#f1f0f5]">Blog</Link>
          <Link href="/#paketler" className="transition-colors hover:text-[#f1f0f5]">IPTV Fiyatları</Link>
          <Link href="/#yorumlar" className="transition-colors hover:text-[#f1f0f5]">Yorumlar</Link>
          <Link href="/#sss" className="transition-colors hover:text-[#f1f0f5]">S.S.S</Link>
          <Link href="/iletisim" className="transition-colors hover:text-[#f1f0f5]">İletişim</Link>
          <Link href="/blog/iptv-nedir" className="transition-colors hover:text-[#f1f0f5]">IPTV Nedir?</Link>
          <Link href="/blog/iptv-kurulum" className="transition-colors hover:text-[#f1f0f5]">Kurulum Rehberi</Link>
        </div>
      </footer>

      {/* ─── Mobil Sticky CTA ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#18181f]/95 px-3 py-2 backdrop-blur-md md:hidden">
        <div className="flex gap-2">
          <button onClick={() => handleOpenModal()}
            className="flex-1 rounded-lg bg-[#7c6fcd] py-2 text-xs font-semibold text-white shadow-lg shadow-[#7c6fcd]/20 transition-colors hover:bg-[#6358b8]">
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
        <div className="rounded-xl border border-[#7c6fcd]/30 bg-[#1c1c25]/95 p-3 shadow-2xl backdrop-blur-md w-52">
          <p className="mb-2 text-[11px] text-[#9b98b0] text-center">⭐ 12 aylık paket popüler</p>
          <button onClick={() => handleOpenModal()}
            className="mb-1.5 w-full rounded-lg bg-[#7c6fcd] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#6358b8]">
            ⚡ Ücretsiz Test Al
          </button>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-lg bg-[#25d366]/10 border border-[#25d366]/20 py-2 text-xs font-semibold text-[#25d366] transition-colors hover:bg-[#25d366]/20">
            💬 WhatsApp'a Yaz
          </a>
        </div>
      </div>

      {/* ─── Modal ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="relative w-full max-w-md overflow-y-auto rounded-t-2xl bg-[#1c1c25] p-6 shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
            <button onClick={handleCloseModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#6b6880] transition-colors hover:bg-white/[0.06] hover:text-white">
              ✕
            </button>

            <Stepper step={step} />

            {/* ── ADIM 1: Cihaz seçimi ───────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Hangi cihazda kullanacaksınız?</h3>
                  <p className="mt-1 text-sm text-[#9b98b0]">Kurulum rehberini cihazınıza göre hazırlayalım.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEVICES.map((device) => (
                    <button key={device.id} onClick={() => setSelectedDevice(device.id)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                        selectedDevice === device.id
                          ? 'border-[#7c6fcd]/60 bg-[#7c6fcd]/10'
                          : 'border-white/[0.08] bg-[#22222c] hover:border-white/[0.08]'
                      }`}>
                      <span className="mb-1 text-xl">{device.icon}</span>
                      <span className={`text-sm font-semibold ${selectedDevice === device.id ? 'text-white' : 'text-[#f1f0f5]'}`}>{device.label}</span>
                      <span className="text-[11px] text-[#9b98b0]">{device.sub}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1.5 as ModalStep)} disabled={!selectedDevice}
                  className="w-full rounded-xl bg-[#7c6fcd] py-3 font-semibold text-white transition-colors hover:bg-[#6358b8] disabled:opacity-40">
                  Devam Et →
                </button>
                <p className="text-center text-xs text-[#6b6880]">Kredi kartı gerekmez · 12 saatlik ücretsiz erişim</p>
              </div>
            )}

            {/* ── ADIM 1.5: İzleme amacı + paket önerisi ─────────────────────── */}
            {step === (1.5 as ModalStep) && (
              <div className="space-y-3">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#18181f] px-2.5 py-1 text-xs text-[#9b98b0]">
                    {DEVICES.find(d => d.id === selectedDevice)?.icon} {DEVICES.find(d => d.id === selectedDevice)?.label} seçildi
                  </div>
                  <h3 className="text-xl font-bold text-white">En çok ne izleyeceksiniz?</h3>
                  <p className="mt-1 text-sm text-[#9b98b0]">Birden fazla seçebilirsiniz.</p>
                </div>
                <div className="space-y-2">
                  {PURPOSES.map((p) => {
                    const selected = selectedPurposes.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => setSelectedPurposes(prev =>
                        prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                      )}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                          selected ? 'border-[#7c6fcd]/60 bg-[#7c6fcd]/10' : 'border-white/[0.08] bg-[#22222c] hover:border-white/[0.08]'
                        }`}>
                        <span className="text-lg">{p.icon}</span>
                        <div className="flex-1">
                          <div className={`text-sm font-semibold ${selected ? 'text-white' : 'text-[#f1f0f5]'}`}>{p.label}</div>
                          <div className="text-[11px] text-[#9b98b0]">{p.sub}</div>
                        </div>
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${
                          selected ? 'border-[#7c6fcd] bg-[#7c6fcd] text-white' : 'border-white/[0.08]'
                        }`}>{selected ? '✓' : ''}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Paket önerisi */}
                {recommendedPkg && selectedPurposes.length > 0 && (
                  <div className="rounded-xl border border-[#7c6fcd]/30 bg-[#7c6fcd]/8 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c6fcd]">✨ Size En Uygun Paket</p>
                    <p className="mt-0.5 text-sm font-bold text-white">{recommendedPkg}</p>
                    <p className="text-[11px] text-[#9b98b0]">Seçimlerinize göre bu paketi öneriyoruz.</p>
                  </div>
                )}

                <button onClick={() => setStep(2)}
                  className="w-full rounded-xl bg-[#7c6fcd] py-3 font-semibold text-white transition-colors hover:bg-[#6358b8]">
                  Testi Başlat →
                </button>
                <button onClick={() => setStep(1)} className="w-full text-xs text-[#6b6880] transition-colors hover:text-[#9b98b0]">← Geri dön</button>
              </div>
            )}

            {/* ── ADIM 2: Email ──────────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">E-posta Adresiniz</h3>
                  <p className="mt-1 text-sm text-[#9b98b0]">Test bilgilerini göndereceğimiz e-posta adresinizi girin.</p>
                </div>
                {selectedDevice && (
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-lg border border-white/[0.08] bg-[#18181f] px-3 py-1.5 text-xs text-[#9b98b0]">
                      {DEVICES.find(d => d.id === selectedDevice)?.icon} {DEVICES.find(d => d.id === selectedDevice)?.label}
                    </div>
                    {selectedPurposes.map(pid => {
                      const p = PURPOSES.find(x => x.id === pid);
                      return p ? (
                        <div key={pid} className="rounded-lg border border-white/[0.08] bg-[#18181f] px-3 py-1.5 text-xs text-[#9b98b0]">
                          {p.icon} {p.label}
                        </div>
                      ) : null;
                    })}
                    {recommendedPkg && (
                      <div className="rounded-lg border border-[#7c6fcd]/30 bg-[#7c6fcd]/10 px-3 py-1.5 text-xs text-[#7c6fcd]">
                        ✨ Öneri: {recommendedPkg}
                      </div>
                    )}
                  </div>
                )}
                <input ref={emailInputRef} type="email" placeholder="ornek@email.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-[#9b98b0] transition-colors focus:border-[#7c6fcd]/60"
                  value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()} />
                <p className="text-xs text-[#6b6880]">Geçici e-posta adresleri kabul edilmemektedir.</p>
                <button onClick={() => handleSendOtp(false)} disabled={loading}
                  className="w-full rounded-xl bg-[#7c6fcd] py-3 font-semibold text-white transition-colors hover:bg-[#6358b8] disabled:opacity-50">
                  {loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                </button>
                {statusMsg && <p className="text-center text-xs text-amber-400">{statusMsg}</p>}
                <div className="flex justify-between text-xs">
                  <button onClick={() => setStep(1.5 as ModalStep)} className="text-[#9b98b0] transition-colors hover:text-[#9b98b0]">← Geri dön</button>
                  <button onClick={() => handleSendOtp(true)} disabled={loading} className="text-[#9b98b0] transition-colors hover:text-[#9b98b0]">
                    Daha önce test aldım →
                  </button>
                </div>
                <div className="border-t border-white/[0.08] pt-3"><WaButton /></div>
              </div>
            )}

            {/* ── ADIM 3: OTP (6 kutulu) ─────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4 text-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Kodu Doğrula</h3>
                  <p className="mt-1 text-sm text-[#9b98b0]">
                    <span className="text-[#f1f0f5]">{email}</span> adresine gönderilen 6 haneli kodu girin.
                  </p>
                </div>

                {/* 6 kutulu OTP */}
                <OTPInput value={otp} onChange={setOtp} />

                <p className="text-xs text-[#6b6880]">Spam klasörünü de kontrol edin.</p>
                {statusMsg && <p className="text-xs text-[#9b98b0]">{statusMsg}</p>}

                {isCreating ? (
                  <div className="rounded-xl border border-white/[0.08] bg-[#18181f] p-4">
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
                    <button onClick={() => { setStep(2); setOtp(''); }} className="text-[#6b6880] transition-colors hover:text-[#9b98b0]">← Geri dön</button>
                    <button onClick={() => handleSendOtp(isRecovery)} disabled={loading || resendCooldown > 0}
                      className="text-[#6b6880] transition-colors hover:text-[#9b98b0] disabled:text-[#c0bdd6]">
                      {resendCooldown > 0 ? `Tekrar gönder (${resendCooldown}s)` : 'Tekrar gönder'}
                    </button>
                  </div>
                )}
                {!isCreating && <div className="border-t border-white/[0.08] pt-3"><WaButton /></div>}
              </div>
            )}

            {/* ── ADIM 4: Başarılı + Credentials + Sonraki adım ──────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">✅</div>
                  <h3 className="text-xl font-bold text-white">{isRecovery ? 'Bilgileriniz Hazır' : 'Testiniz Açıldı!'}</h3>
                  <p className="mt-1 text-sm text-[#9b98b0]">Bilgiler <span className="text-[#f1f0f5]">{email}</span> adresine de gönderildi.</p>
                </div>

                {trialCredentials && (
                  <div className="rounded-xl border border-white/[0.08] bg-[#22222c] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-xs font-semibold text-emerald-400">Aktif Test Hesabı</span>
                      </div>
                      <Countdown startedAt={trialCredentials.startedAt} />
                    </div>
                    <div className="divide-y divide-white/5">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-[#9b98b0]">Sunucu</span>
                        <div className="flex items-center">
                          <span className="rounded-md bg-[#7c6fcd]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#7c6fcd]">http://pro4kiptv.xyz:2086</span>
                          <CopyButton value="http://pro4kiptv.xyz:2086/" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-[#9b98b0]">Kullanıcı Adı</span>
                        <div className="flex items-center">
                          <span className="rounded-md bg-[#7c6fcd]/10 px-2 py-0.5 font-mono text-sm font-bold text-[#7c6fcd]">{trialCredentials.username}</span>
                          <CopyButton value={trialCredentials.username} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-[#9b98b0]">Şifre</span>
                        <div className="flex items-center">
                          <span className="rounded-md bg-[#7c6fcd]/10 px-2 py-0.5 font-mono text-sm font-bold text-[#7c6fcd]">{trialCredentials.password}</span>
                          <CopyButton value={trialCredentials.password} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg border border-[#7c6fcd]/20 bg-[#7c6fcd]/5 p-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9b98b0]">M3U Linki</span>
                        <CopyButton value={m3uLink} />
                      </div>
                      <p className="break-all font-mono text-[10px] leading-relaxed text-[#f1f0f5]">{m3uLink}</p>
                    </div>
                  </div>
                )}

                {/* ── Sonraki adım rehberi ── */}
                <div className="rounded-xl border border-white/[0.08] bg-[#18181f] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9b98b0]">📋 Bundan Sonra Ne Yapacaksınız?</p>
                  <ol className="space-y-2">
                    {[
                      { step: '1', text: 'Uygulamayı cihazınıza indirin', sub: selectedDevice ? INSTALL_GUIDES[selectedDevice as DeviceId]?.app : 'IPTV Smarters Pro' },
                      { step: '2', text: 'Yukarıdaki bilgileri uygulamaya girin', sub: 'Sunucu, kullanıcı adı ve şifreni kopyala' },
                      { step: '3', text: 'Testi başlatın', sub: '12 saat boyunca tüm kanalları deneyin' },
                      { step: '4', text: 'Memnun kaldıysanız paketi seçin', sub: 'WhatsApp\'tan satın alım yapabilirsiniz' },
                    ].map((item) => (
                      <li key={item.step} className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7c6fcd]/20 text-[10px] font-bold text-[#7c6fcd]">{item.step}</span>
                        <div>
                          <p className="text-xs font-medium text-white">{item.text}</p>
                          <p className="text-[11px] text-[#9b98b0]">{item.sub}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <WaButton label="💬 Beğendiyseniz Satın Alın" />

                {/* Kurulum Rehberi */}
                {selectedDevice && INSTALL_GUIDES[selectedDevice as DeviceId] && (() => {
                  const guide = INSTALL_GUIDES[selectedDevice as DeviceId];
                  return (
                    <div className="rounded-xl border border-white/[0.08] bg-[#22222c] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-base">{DEVICES.find(d => d.id === selectedDevice)?.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-[#f1f0f5]">Kurulum Rehberi</p>
                          <p className="text-[11px] text-[#7c6fcd]">{guide.app}</p>
                        </div>
                      </div>
                      <ol className="space-y-1.5">
                        {guide.steps.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-xs text-[#9b98b0]">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#7c6fcd]/20 text-[10px] font-bold text-[#7c6fcd]">{i + 1}</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ol>
                      {guide.note && (
                        <p className="mt-3 rounded-lg border border-amber-900/30 bg-amber-950/20 px-3 py-2 text-[11px] leading-relaxed text-amber-400/80">
                          💡 {guide.note}
                        </p>
                      )}
                    </div>
                  );
                })()}

                <button onClick={handleCloseModal}
                  className="w-full rounded-lg border border-white/[0.08] py-2.5 text-sm text-[#9b98b0] transition-colors hover:border-white/[0.08] hover:text-[#f1f0f5]">
                  Pencereyi Kapat
                </button>
              </div>
            )}

            {/* ── ADIM 5: Daha önce test alındı ──────────────────────────────── */}
            {step === 5 && (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-2xl">⏳</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Daha Önce Test Aldınız</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#9b98b0]">{alreadyUsedMsg}</p>
                </div>
                <WaButton label="💬 WhatsApp ile Satın Al" />
                <button onClick={() => { setStep(1); setEmail(''); setAlreadyUsedMsg(''); }}
                  className="w-full text-xs text-[#6b6880] transition-colors hover:text-[#9b98b0]">
                  Farklı e-posta ile dene
                </button>
                <button onClick={handleCloseModal} className="w-full text-xs text-[#6b6880] transition-colors hover:text-[#9b98b0]">Kapat</button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
