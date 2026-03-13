'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Metadata notu ────────────────────────────────────────────────────────────
// Bu sayfa 'use client' olduğundan metadata'yı layout.tsx'e ekle:
// export const metadata = {
//   title: 'IPTV Satın Al | 4K IPTV Paketleri – Galya IPTV',
//   description: 'Türkiye\'nin en kaliteli IPTV hizmeti. 85.000+ kanal, 4K yayın. ₺500\'den başlayan fiyatlarla en iyi IPTV server. Ücretsiz test al.',
//   keywords: 'iptv satın al, iptv fiyat, 4k iptv, en iyi iptv, iptv server, iptv nedir',
// }

const WHATSAPP_URL = 'https://wa.me/447441921660?text=Merhaba%2C%20sat%C4%B1n%20almak%20istiyorum.';

// Paketler — aylık maliyet + tasarruf yüzdesi eklendi
const packages = [
  {
    name: '1 Aylık Paket', duration: '1 Ay IPTV', price: '500',
    monthlyPrice: '500', saving: null,
    features: ['85.000+ Kanal', 'Full HD Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'],
    popular: false,
  },
  {
    name: '3 Aylık Paket', duration: '3 Ay IPTV', price: '700',
    monthlyPrice: '233', saving: '%53',
    features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'],
    popular: false,
  },
  {
    name: '6 Aylık Paket', duration: '6 Ay IPTV', price: '1.000',
    monthlyPrice: '167', saving: '%67',
    features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'],
    popular: false,
  },
  {
    name: '12 Aylık Paket', duration: '12 Ay IPTV', price: '1.400',
    monthlyPrice: '117', saving: '%77',
    features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'],
    popular: true,
  },
  {
    name: '24 Aylık Paket', duration: '24 Ay IPTV', price: '2.200',
    monthlyPrice: '92', saving: '%82',
    features: ['85.000+ Kanal', '4K Ultra HD', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum', 'VIP Destek'],
    popular: false,
  },
  {
    name: 'Süresiz Paket', duration: 'Sınırsız IPTV', price: '6.900',
    monthlyPrice: null, saving: null,
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

// Müşteri yorumları
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

// Schema Markup
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
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '5', reviewCount: '10000', bestRating: '5' },
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
        copied ? 'border-emerald-600 text-emerald-400' : 'border-white/10 text-slate-500 hover:border-[#6366f1]/50 hover:text-[#818cf8]'
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
                done ? 'bg-[#6366f1] text-white' : current ? 'border-2 border-[#6366f1] text-[#818cf8]' : 'border border-white/10 text-slate-600'
              }`}>
                {done ? '✓' : idx}
              </span>
              <span className={`text-[9px] ${current ? 'text-[#818cf8]' : done ? 'text-slate-500' : 'text-slate-700'}`}>{label}</span>
            </span>
            {i < STEP_LABELS.length - 1 && <span className={`mb-4 h-px w-8 ${done ? 'bg-[#6366f1]' : 'bg-white/5'}`} />}
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
        <span className="text-slate-400">{statuses[statusIndex]}</span>
        <span className="font-mono text-[#818cf8]">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#818cf8] transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-center text-[11px] text-slate-500">Bu işlem 30–40 saniye sürebilir, lütfen bekleyin.</p>
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

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 2) setTimeout(() => emailInputRef.current?.focus(), 100);
  }, [step]);

  const handleOpenModal = (pkg?: string) => {
    setIsModalOpen(true); setStep(1); setSelectedPackage(pkg || '');
    setSelectedDevice(''); setSelectedPurposes([]);
    setEmail(''); setOtp(''); setOtpToken('');
    setStatusMsg(''); setAlreadyUsedMsg('');
    setResendCooldown(0); setIsRecovery(false);
    setTrialCredentials(null); setIsCreating(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); setStep(1); setSelectedPackage('');
    setSelectedDevice(''); setSelectedPurposes([]);
    setEmail(''); setOtp(''); setOtpToken('');
    setStatusMsg(''); setAlreadyUsedMsg('');
    setLoading(false); setResendCooldown(0); setIsRecovery(false);
    setTrialCredentials(null); setIsCreating(false);
  };

  const handleSendOtp = async (recoveryMode = false) => {
    if (!email) return alert('Lütfen e-posta adresinizi girin.');
    setLoading(true); setStatusMsg('');
    try {
      const res = await fetch('/api/test-talep', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', email, selectedPackage }),
      });
      const data = await res.json();
      if (data.alreadyUsed) { if (recoveryMode) { setIsRecovery(true); } else { setAlreadyUsedMsg(data.error); setStep(5); return; } }
      if (data.cooldown) { setResendCooldown(data.retryAfter || 60); setStatusMsg(data.error); return; }
      if (data.success) { setOtpToken(data.token); setIsRecovery(recoveryMode); setStep(3); setResendCooldown(60); }
      else { alert(data.error || 'Kod gönderilemedi.'); }
    } catch { alert('Sunucuya bağlanılamadı.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return alert('Lütfen doğrulama kodunu girin.');
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
      if (data.success) { setTrialCredentials({ username: data.username, password: data.password, startedAt: Date.now() }); setStep(4); setStatusMsg(''); setIsCreating(false); }
      else { alert(data.error || 'Kod hatalı.'); setStatusMsg(''); setIsCreating(false); }
    } catch { alert('Bir hata oluştu.'); setStatusMsg(''); setIsCreating(false); }
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

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#141520]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Galya <span className="text-[#6366f1]">IPTV</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
            <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
            <Link href="/#yorumlar" className="transition-colors hover:text-white">Yorumlar</Link>
            <Link href="/#neden-biz" className="transition-colors hover:text-white">Neden Biz</Link>
            <Link href="/#sss" className="transition-colors hover:text-white">S.S.S</Link>
            <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
            <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
            <button onClick={() => handleOpenModal()}
              className="rounded-lg border border-[#6366f1]/40 bg-[#6366f1]/10 px-4 py-2 text-sm font-medium text-[#818cf8] transition-all hover:bg-[#6366f1]/20 hover:text-white">
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
          <div className="border-t border-white/10 bg-[#141520] px-6 pb-4 md:hidden">
            <div className="flex flex-col gap-1 pt-3 text-sm">
              {[
                { href: '/#paketler', label: 'Paketler' },
                { href: '/#yorumlar', label: 'Yorumlar' },
                { href: '/#neden-biz', label: 'Neden Biz' },
                { href: '/#sss', label: 'S.S.S' },
                { href: '/blog', label: 'Blog' },
                { href: '/iletisim', label: 'İletişim' },
              ].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white">
                  {item.label}
                </Link>
              ))}
              <button onClick={() => { handleOpenModal(); setMobileMenuOpen(false); }}
                className="mt-2 w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white">
                Ücretsiz Test Al
              </button>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 font-semibold text-white">
                💬 WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="bg-[#141520] text-white">

        {/* ─── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-[#6366f1]/6 blur-3xl" />
          <div className="relative mx-auto max-w-4xl">

            {/* Canlı aciliyet rozeti */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-1.5 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Bu ay <span className="text-white font-medium mx-1">847 kişi</span> satın aldı · 4K Yayın · 85.000+ Kanal
            </div>

            {/* H1 — SEO optimize: hedef kelimeler öne */}
            <h1 className="mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              IPTV Satın Al –<br />
              <span className="text-[#6366f1]">4K Kalite, 85.000+ Kanal</span>
            </h1>

            <p className="mx-auto mb-4 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              En iyi IPTV server ile canlı TV, spor, film ve dizi — tek üyelikle tüm cihazlarda.
              ₺500'den başlayan fiyatlarla, <strong className="text-white font-medium">ücretsiz test</strong> ile başla.
            </p>

            {/* Micro güven metni */}
            <p className="mb-8 text-xs text-slate-500">
              Kredi kartı gerektirmez · 12 saatlik ücretsiz erişim · Anında kurulum
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={() => handleOpenModal()}
                className="w-full sm:w-auto rounded-xl bg-[#6366f1] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#6366f1]/25 transition-all hover:bg-[#4f46e5] hover:shadow-[#6366f1]/40 hover:scale-[1.02]">
                🎯 Ücretsiz Test Al
              </button>
              <Link href="/#paketler"
                className="w-full sm:w-auto rounded-xl border border-white/10 px-8 py-4 text-base font-semibold text-slate-200 transition-all hover:bg-white/5 hover:text-white hover:border-white/20">
                IPTV Fiyatlarına Bak →
              </Link>
            </div>

            {/* Sosyal kanıt şeridi */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> 10.000+ mutlu kullanıcı</span>
              <span className="hidden sm:block text-slate-700">|</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> %99.9 uptime garantisi</span>
              <span className="hidden sm:block text-slate-700">|</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> 7/24 teknik destek</span>
              <span className="hidden sm:block text-slate-700">|</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Anında kurulum</span>
            </div>

            {/* Stat kartları */}
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { v: '85.000+', l: 'Canlı Kanal' },
                { v: '4K / FHD', l: 'Görüntü Kalitesi' },
                { v: '10.000+', l: 'Aktif Kullanıcı' },
                { v: '7/24', l: 'Teknik Destek' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.05] p-4 text-left transition-colors hover:border-white/10">
                  <div className="text-lg font-bold text-white">{s.v}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Güven rozetleri şeridi ─────────────────────────────────────────── */}
        <section className="border-y border-white/10 bg-white/[0.01] px-6 py-5">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: '🔒', label: 'SSL Güvenli' },
              { icon: '💬', label: 'WhatsApp Destek' },
              { icon: '🆓', label: 'Ücretsiz Test' },
              { icon: '⚡', label: 'Anında Kurulum' },
              { icon: '🛡️', label: 'Gizlilik Korumalı' },
              { icon: '↩️', label: 'Sorun Çözme Garantisi' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-base">{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Packages ──────────────────────────────────────────────────────── */}
        <section id="paketler" className="border-t border-white/10 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">IPTV Paket Fiyatları</h2>
              <p className="mt-3 text-sm text-slate-400">Tek seferlik ödeme, abonelik yok. Uzun vadede büyük tasarruf.</p>
            </div>

            {/* Paket karşılaştırma toggle */}
            <div className="mb-8 text-center">
              <button onClick={() => setShowCompare(!showCompare)}
                className="rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-400 transition-all hover:border-white/20 hover:text-white">
                {showCompare ? '▲ Tabloyu Gizle' : '⇄ Paketleri Karşılaştır'}
              </button>
            </div>

            {/* Karşılaştırma tablosu */}
            {showCompare && (
              <div className="mb-10 overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.06]">
                      <th className="px-4 py-3 text-left font-medium text-slate-400">Özellik</th>
                      {packages.map((p) => (
                        <th key={p.name} className={`px-3 py-3 text-center font-semibold ${p.popular ? 'text-[#818cf8]' : 'text-slate-200'}`}>
                          {p.name.replace(' Paket', '')}
                          {p.popular && <span className="ml-1 text-[10px] text-[#6366f1]">★</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row, ri) => (
                      <tr key={row.label} className={`border-b border-white/10 ${ri % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-4 py-2.5 text-slate-400">{row.label}</td>
                        {row.values.map((val, vi) => (
                          <td key={vi} className={`px-3 py-2.5 text-center ${
                            packages[vi]?.popular ? 'text-[#818cf8] font-semibold'
                            : val === '✗' ? 'text-slate-600'
                            : val === '✓' ? 'text-emerald-400'
                            : 'text-slate-200'
                          }`}>{val}</td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-white/[0.07]">
                      <td className="px-4 py-3 font-medium text-slate-400">Toplam Fiyat</td>
                      {packages.map((p) => (
                        <td key={p.name} className={`px-3 py-3 text-center font-bold ${p.popular ? 'text-white' : 'text-slate-200'}`}>
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
                      ? 'border-[#6366f1]/60 bg-gradient-to-b from-[#6366f1]/10 to-[#6366f1]/[0.03] shadow-xl shadow-[#6366f1]/10'
                      : 'border-white/10 bg-white/[0.05] hover:border-white/15 hover:bg-white/[0.07]'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#6366f1] to-[#6366f1] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-[#6366f1]/30">
                      ⭐ En Çok Tercih Edilen
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{pkg.duration}</div>
                    <h3 className="mt-1.5 text-lg font-bold text-white">{pkg.name}</h3>
                  </div>

                  {/* Fiyat + aylık maliyet + tasarruf */}
                  <div className="mb-2">
                    <span className="text-4xl font-extrabold text-white">₺{pkg.price}</span>
                    <span className="ml-1.5 text-sm text-slate-500">tek ödeme</span>
                  </div>
                  {pkg.monthlyPrice ? (
                    <div className="mb-5 flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        Aylık yalnızca <span className={`font-semibold ${pkg.popular ? 'text-[#818cf8]' : 'text-slate-200'}`}>₺{pkg.monthlyPrice}</span>
                      </span>
                      {pkg.saving && (
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${pkg.popular ? 'bg-[#6366f1]/20 text-[#818cf8]' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {pkg.saving} tasarruf
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mb-5 text-xs text-slate-500">Ömür boyu tek ödeme</div>
                  )}

                  <ul className="mb-6 flex-1 space-y-2.5">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400">
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${pkg.popular ? 'bg-[#6366f1]/20 text-[#818cf8]' : 'bg-emerald-500/10 text-emerald-400'}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <a href={`https://wa.me/447441921660?text=Merhaba%2C%20${encodeURIComponent(pkg.name)}%20sat%C4%B1n%20almak%20istiyorum.`}
                    target="_blank" rel="noopener noreferrer"
                    className={`mb-3 flex w-full items-center justify-center rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                      pkg.popular
                        ? 'bg-[#6366f1] text-white shadow-md shadow-[#6366f1]/25 hover:bg-[#4f46e5] hover:shadow-[#6366f1]/40'
                        : 'border border-white/15 bg-white/[0.07] text-white hover:bg-white/[0.08] hover:border-white/25'
                    }`}>
                    💬 WhatsApp ile Satın Al
                  </a>
                  <button onClick={() => handleOpenModal(pkg.name)}
                    className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2.5 text-xs font-medium text-white transition-all hover:border-white/30 hover:bg-white/[0.07]">
                    Önce Ücretsiz Test Al
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-slate-500">
              💳 Ödeme WhatsApp üzerinden güvenli şekilde gerçekleşir · Kurulum desteği dahil · Sorun yaşarsanız çözüm garantisi
            </p>
          </div>
        </section>

        {/* ─── Müşteri Yorumları ──────────────────────────────────────────────── */}
        <section id="yorumlar" className="border-t border-white/10 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Müşteri Yorumları</h2>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Stars count={5} />
                <span className="text-sm text-slate-400">10.000+ kullanıcı · Ortalama <strong className="text-white">5.0</strong>/5</span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <div key={r.initials} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 transition-all hover:border-white/15 hover:bg-white/[0.07]">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6366f1]/20 text-sm font-bold text-[#818cf8]">
                        {r.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.city}</div>
                      </div>
                    </div>
                    <Stars count={r.stars} />
                  </div>
                  <p className="text-sm leading-relaxed text-slate-400">"{r.text}"</p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="mb-4 text-sm text-slate-400">Siz de denemek ister misiniz? Önce ücretsiz test alın.</p>
              <button onClick={() => handleOpenModal()}
                className="rounded-xl bg-[#6366f1] px-8 py-3.5 font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition-all hover:bg-[#4f46e5] hover:scale-[1.02]">
                Ücretsiz Test Al →
              </button>
            </div>
          </div>
        </section>

        {/* ─── Neden Biz ─────────────────────────────────────────────────────── */}
        <section id="neden-biz" className="border-t border-white/10 px-6 py-20">
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
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.07] p-5 transition-all hover:border-white/10 hover:bg-white/[0.035]">
                  <div className="mb-3 text-2xl">{item.icon}</div>
                  <h3 className="mb-1.5 font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <button onClick={() => handleOpenModal()}
                className="rounded-xl border border-white/15 bg-white/[0.07] px-8 py-3.5 font-semibold text-white transition-all hover:bg-white/[0.08]">
                Hemen Test Al →
              </button>
            </div>
          </div>
        </section>

        {/* ─── SSS ───────────────────────────────────────────────────────────── */}
        <section id="sss" className="border-t border-white/10 px-6 py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-3 text-center text-3xl font-bold tracking-tight md:text-4xl">Sıkça Sorulan Sorular</h2>
            <p className="mb-10 text-center text-sm text-slate-400">IPTV satın almadan önce merak ettikleriniz</p>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-white/10 bg-white/[0.07] px-5 py-4 transition-colors hover:border-white/10">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-zinc-200">
                    {faq.q}
                    <span className="shrink-0 text-[10px] text-slate-600 transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Final ─────────────────────────────────────────────────────── */}
        <section className="border-t border-white/10 px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#6366f1]/30 bg-[#6366f1]/8 px-4 py-1.5 text-xs text-[#818cf8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1] animate-pulse" />
              Hâlâ kararsız mısınız? Önce ücretsiz deneyin.
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-4xl">Hemen Başlayın</h2>
            <p className="mb-2 text-sm text-slate-400">Ücretsiz test ile kaliteyi görün, sonra karar verin.</p>
            <p className="mb-8 text-xs text-slate-600">Kredi kartı gerekmez · 12 saatlik erişim · Anında kurulum</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={() => handleOpenModal()}
                className="rounded-xl bg-[#6366f1] px-10 py-4 font-semibold text-white shadow-xl shadow-[#6366f1]/25 transition-all hover:bg-[#4f46e5] hover:scale-[1.02]">
                🎯 Ücretsiz Test Al
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
      <footer className="border-t border-white/10 bg-[#141520] px-6 py-12 text-center text-sm text-slate-600">
        <p className="mb-1 font-semibold text-slate-400">Galya IPTV</p>
        <p className="mb-1 text-xs text-slate-600">Türkiye'nin en kaliteli 4K IPTV hizmeti · 85.000+ kanal · 10.000+ aktif kullanıcı</p>
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-5 text-xs">
          <Link href="/blog" className="transition-colors hover:text-slate-200">Blog</Link>
          <Link href="/#paketler" className="transition-colors hover:text-slate-200">IPTV Fiyatları</Link>
          <Link href="/#yorumlar" className="transition-colors hover:text-slate-200">Yorumlar</Link>
          <Link href="/#sss" className="transition-colors hover:text-slate-200">S.S.S</Link>
          <Link href="/iletisim" className="transition-colors hover:text-slate-200">İletişim</Link>
          <Link href="/blog/iptv-nedir" className="transition-colors hover:text-slate-200">IPTV Nedir?</Link>
          <Link href="/blog/iptv-kurulum" className="transition-colors hover:text-slate-200">Kurulum Rehberi</Link>
        </div>
      </footer>

      {/* ─── Mobil Sticky CTA ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#141520]/95 px-3 py-2 backdrop-blur-md md:hidden">
        <div className="flex gap-2">
          <button onClick={() => handleOpenModal()}
            className="flex-1 rounded-lg bg-[#6366f1] py-2 text-xs font-semibold text-white shadow-lg shadow-[#6366f1]/20 transition-colors hover:bg-[#4f46e5]">
            🎯 Ücretsiz Test Al
          </button>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center rounded-lg bg-[#25d366] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1ebe5d]">
            💬 WhatsApp
          </a>
        </div>
      </div>

      {/* ─── Modal ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:py-8" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e2030] p-6 shadow-2xl">
            <button onClick={handleCloseModal} className="float-right text-slate-500 transition-colors hover:text-slate-200">✕</button>

            {step !== 5 && <Stepper step={step} />}

            {/* ── ADIM 1: Cihaz seç ──────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-white">Hangi cihazda izleyeceksiniz?</h3>
                  <p className="mt-1 text-sm text-slate-400">Size özel kurulum rehberi gönderelim.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEVICES.map((device) => (
                    <button key={device.id} onClick={() => setSelectedDevice(device.id)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                        selectedDevice === device.id
                          ? 'border-[#6366f1]/60 bg-[#6366f1]/10'
                          : 'border-white/10 bg-white/[0.07] hover:border-white/10'
                      }`}>
                      <span className="mb-1 text-xl">{device.icon}</span>
                      <span className={`text-sm font-semibold ${selectedDevice === device.id ? 'text-white' : 'text-slate-200'}`}>{device.label}</span>
                      <span className="text-[11px] text-slate-500">{device.sub}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1.5 as ModalStep)} disabled={!selectedDevice}
                  className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5] disabled:opacity-40">
                  Devam Et →
                </button>
                <p className="text-center text-xs text-slate-600">Kredi kartı gerekmez · 12 saatlik ücretsiz erişim</p>
              </div>
            )}

            {/* ── ADIM 1.5: İzleme amacı ──────────────────────────────────── */}
            {step === (1.5 as ModalStep) && (
              <div className="space-y-3">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-slate-400">
                    {DEVICES.find(d => d.id === selectedDevice)?.icon} {DEVICES.find(d => d.id === selectedDevice)?.label} seçildi
                  </div>
                  <h3 className="text-xl font-bold text-white">En çok ne izleyeceksiniz?</h3>
                  <p className="mt-1 text-sm text-slate-400">Birden fazla seçebilirsiniz.</p>
                </div>
                <div className="space-y-2">
                  {PURPOSES.map((p) => {
                    const selected = selectedPurposes.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => setSelectedPurposes(prev =>
                        prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                      )}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                          selected ? 'border-[#6366f1]/60 bg-[#6366f1]/10' : 'border-white/10 bg-white/[0.07] hover:border-white/10'
                        }`}>
                        <span className="text-lg">{p.icon}</span>
                        <div className="flex-1">
                          <div className={`text-sm font-semibold ${selected ? 'text-white' : 'text-slate-200'}`}>{p.label}</div>
                          <div className="text-[11px] text-slate-500">{p.sub}</div>
                        </div>
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-all ${
                          selected ? 'border-[#6366f1] bg-[#6366f1] text-white' : 'border-white/10'
                        }`}>{selected ? '✓' : ''}</div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setStep(2)}
                  className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5]">
                  Testi Başlat →
                </button>
                <button onClick={() => setStep(1)} className="w-full text-xs text-slate-600 transition-colors hover:text-slate-400">← Geri dön</button>
              </div>
            )}

            {/* ── ADIM 2: Email ──────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">E-posta Adresiniz</h3>
                  <p className="mt-1 text-sm text-slate-400">Test bilgilerini göndereceğimiz e-posta adresinizi girin.</p>
                </div>
                {selectedDevice && (
                  <div className="flex flex-wrap gap-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-400">
                      {DEVICES.find(d => d.id === selectedDevice)?.icon} {DEVICES.find(d => d.id === selectedDevice)?.label}
                    </div>
                    {selectedPurposes.map(pid => {
                      const p = PURPOSES.find(x => x.id === pid);
                      return p ? (
                        <div key={pid} className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-400">
                          {p.icon} {p.label}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                <input ref={emailInputRef} type="email" placeholder="ornek@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition-colors focus:border-[#6366f1]/60"
                  value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()} />
                <p className="text-xs text-slate-600">Geçici e-posta adresleri kabul edilmemektedir.</p>
                <button onClick={() => handleSendOtp(false)} disabled={loading}
                  className="w-full rounded-xl bg-[#6366f1] py-3 font-semibold text-white transition-colors hover:bg-[#4f46e5] disabled:opacity-50">
                  {loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                </button>
                {statusMsg && <p className="text-center text-xs text-amber-400">{statusMsg}</p>}
                <div className="flex justify-between text-xs">
                  <button onClick={() => setStep(1.5 as ModalStep)} className="text-slate-500 transition-colors hover:text-slate-400">← Geri dön</button>
                  <button onClick={() => handleSendOtp(true)} disabled={loading} className="text-slate-500 transition-colors hover:text-slate-400">
                    Daha önce test aldım →
                  </button>
                </div>
                <div className="border-t border-white/10 pt-3"><WaButton /></div>
              </div>
            )}

            {/* ── ADIM 3: OTP ────────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4 text-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Kodu Doğrula</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    <span className="text-slate-200">{email}</span> adresine gönderilen 6 haneli kodu girin.
                  </p>
                </div>
                <input type="text" placeholder="000000" maxLength={6} inputMode="numeric"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center font-mono text-3xl font-bold tracking-[10px] text-white outline-none transition-colors focus:border-[#6366f1]/60"
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()} />
                <p className="text-xs text-slate-600">Spam klasörünü de kontrol edin.</p>
                {statusMsg && <p className="text-xs text-slate-400">{statusMsg}</p>}

                {isCreating ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
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
                    <button onClick={() => { setStep(2); setOtp(''); }} className="text-slate-600 transition-colors hover:text-slate-400">← Geri dön</button>
                    <button onClick={() => handleSendOtp(isRecovery)} disabled={loading || resendCooldown > 0}
                      className="text-slate-600 transition-colors hover:text-slate-400 disabled:text-slate-700">
                      {resendCooldown > 0 ? `Tekrar gönder (${resendCooldown}s)` : 'Tekrar gönder'}
                    </button>
                  </div>
                )}
                {!isCreating && <div className="border-t border-white/10 pt-3"><WaButton /></div>}
              </div>
            )}

            {/* ── ADIM 4: Başarılı + Credentials ────────────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">✅</div>
                  <h3 className="text-xl font-bold text-white">{isRecovery ? 'Bilgileriniz Hazır' : 'Testiniz Açıldı!'}</h3>
                  <p className="mt-1 text-sm text-slate-400">Bilgiler <span className="text-slate-200">{email}</span> adresine de gönderildi.</p>
                </div>

                {trialCredentials && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.07] p-4">
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
                        <span className="text-xs text-slate-400">Sunucu</span>
                        <div className="flex items-center">
                          <span className="rounded-md bg-[#6366f1]/10 px-2 py-0.5 font-mono text-xs font-bold text-[#818cf8]">http://pro4kiptv.xyz:2086</span>
                          <CopyButton value="http://pro4kiptv.xyz:2086/" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-400">Kullanıcı Adı</span>
                        <div className="flex items-center">
                          <span className="rounded-md bg-[#6366f1]/10 px-2 py-0.5 font-mono text-sm font-bold text-[#818cf8]">{trialCredentials.username}</span>
                          <CopyButton value={trialCredentials.username} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-400">Şifre</span>
                        <div className="flex items-center">
                          <span className="rounded-md bg-[#6366f1]/10 px-2 py-0.5 font-mono text-sm font-bold text-[#818cf8]">{trialCredentials.password}</span>
                          <CopyButton value={trialCredentials.password} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg border border-[#6366f1]/20 bg-[#6366f1]/5 p-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">M3U Linki</span>
                        <CopyButton value={m3uLink} />
                      </div>
                      <p className="break-all font-mono text-[10px] leading-relaxed text-slate-200">{m3uLink}</p>
                    </div>
                  </div>
                )}

                <WaButton label="💬 Beğendiyseniz Satın Alın" />

                {/* ── Kurulum Rehberi ── */}
                {selectedDevice && INSTALL_GUIDES[selectedDevice as DeviceId] && (() => {
                  const guide = INSTALL_GUIDES[selectedDevice as DeviceId];
                  return (
                    <div className="rounded-xl border border-white/10 bg-white/[0.07] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-base">{DEVICES.find(d => d.id === selectedDevice)?.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-200">Kurulum Rehberi</p>
                          <p className="text-[11px] text-[#818cf8]">{guide.app}</p>
                        </div>
                      </div>
                      <ol className="space-y-1.5">
                        {guide.steps.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-xs text-slate-400">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#6366f1]/20 text-[10px] font-bold text-[#818cf8]">{i + 1}</span>
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
                  className="w-full rounded-lg border border-white/10 py-2.5 text-sm text-slate-500 transition-colors hover:border-white/10 hover:text-slate-200">
                  Pencereyi Kapat
                </button>
              </div>
            )}

            {/* ── ADIM 5: Daha önce test alındı ──────────────────────────── */}
            {step === 5 && (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-2xl">⏳</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Daha Önce Test Aldınız</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{alreadyUsedMsg}</p>
                </div>
                <WaButton label="💬 WhatsApp ile Satın Al" />
                <button onClick={() => { setStep(1); setEmail(''); setAlreadyUsedMsg(''); }}
                  className="w-full text-xs text-slate-600 transition-colors hover:text-slate-400">
                  Farklı e-posta ile dene
                </button>
                <button onClick={handleCloseModal} className="w-full text-xs text-slate-600 transition-colors hover:text-slate-400">Kapat</button>
              </div>
            )}

          </div>
          </div>
        </div>
      )}
    </>
  );
}
