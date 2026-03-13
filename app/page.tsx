'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const WHATSAPP_URL = 'https://wa.me/447441921660?text=Merhaba%2C%20sat%C4%B1n%20almak%20istiyorum.';

const packages = [
  { name: '1 Aylık Paket', duration: '1 Ay IPTV', price: '500', features: ['85.000+ Kanal', 'Full HD Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'], popular: false },
  { name: '3 Aylık Paket', duration: '3 Ay IPTV', price: '700', features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'], popular: true },
  { name: '6 Aylık Paket', duration: '6 Ay IPTV', price: '1.000', features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '2 Bağlantı', 'Ücretsiz Kurulum'], popular: false },
  { name: '12 Aylık Paket', duration: '12 Ay IPTV', price: '1.400', features: ['85.000+ Kanal', '4K Yayın', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum'], popular: false },
  { name: '24 Aylık Paket', duration: '24 Ay IPTV', price: '2.200', features: ['85.000+ Kanal', '4K Ultra HD', '7/24 Destek', '1 Bağlantı', 'Ücretsiz Kurulum', 'VIP Destek'], popular: false },
  { name: 'Süresiz Paket', duration: 'Sınırsız IPTV', price: '6.900', features: ['85.000+ Kanal', '4K Ultra HD', '7/24 Destek', '2 Bağlantı', 'Ücretsiz Kurulum', 'VIP Destek'], popular: false },
];

const modalPackages = [
  { label: '3 Aylık Paket', price: '₺700', popular: true },
  { label: '6 Aylık Paket', price: '₺1.000' },
  { label: '12 Aylık Paket', price: '₺1.400' },
  { label: 'Henüz karar vermedim', price: '' },
];

const faqs = [
  { q: 'IPTV nedir ve nasıl çalışır?', a: 'IPTV, televizyon yayınlarının internet protokolü üzerinden izlenmesini sağlayan bir sistemdir. Kablolu yayın mantığından farklı olarak içerikler internet bağlantınız üzerinden cihazınıza ulaşır. Galya IPTV ile canlı TV, spor, film ve dizi içeriklerini birçok cihazda kolayca izleyebilirsiniz.' },
  { q: 'IPTV satın almadan önce test alabilir miyim?', a: 'Evet. Hizmeti satın almadan önce ücretsiz test talep ederek yayın kalitesini, kanal geçiş hızını ve cihaz uyumluluğunu görebilirsiniz.' },
  { q: 'Hangi cihazlarda IPTV kullanabilirim?', a: 'Android TV, Smart TV, Android telefon, iPhone, tablet, TV Box, bilgisayar, Apple TV, MAG cihazlar ve daha fazlasında kullanabilirsiniz.' },
  { q: 'IPTV donma sorunu neden olur?', a: 'Donma sorunu çoğu zaman internet hızı, Wi-Fi kalitesi, cihaz performansı veya uygulama seçimi nedeniyle olur.' },
  { q: 'Kurulum desteği veriyor musunuz?', a: 'Evet. Kurulum aşamasında adım adım destek sağlıyoruz.' },
  { q: 'IPTV fiyatları neye göre değişiyor?', a: 'Fiyatlar paket süresine, bağlantı sayısına ve destek seviyesine göre değişir.' },
];

const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
const productSchema = { '@context': 'https://schema.org', '@type': 'Product', name: 'Galya IPTV Paketleri', image: 'https://galyaiptv.com.tr/og-image.jpg', description: 'Galya IPTV paketleri ile 4K ve Full HD yayın kalitesinde içeriklere erişin.', brand: { '@type': 'Brand', name: 'Galya IPTV' }, offers: { '@type': 'AggregateOffer', lowPrice: '500', highPrice: '6900', priceCurrency: 'TRY', availability: 'https://schema.org/InStock', offerCount: '6', url: 'https://galyaiptv.com.tr/#paketler' } };
const organizationSchema = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Galya IPTV', url: 'https://galyaiptv.com.tr/', logo: 'https://galyaiptv.com.tr/logo.png', contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', url: 'https://wa.me/447441921660', availableLanguage: ['Turkish'] }] };

// 1 → paket seç | 2 → email | 3 → otp | 4 → başarılı | 5 → zaten test alındı
type ModalStep = 1 | 2 | 3 | 4 | 5;

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
    <button
      onClick={handle}
      className={`ml-2 rounded-md border px-2 py-0.5 text-xs transition-all ${
        copied
          ? 'border-green-500 text-green-400'
          : 'border-gray-700 text-gray-500 hover:border-purple-500 hover:text-purple-400'
      }`}
    >
      {copied ? '✓' : 'Kopyala'}
    </button>
  );
}

// ─── Geri sayım (trialdaki 12 saat için) ─────────────────────────────────────
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
    <div className="flex items-center justify-center gap-1 rounded-lg border border-green-900/60 bg-black/30 px-3 py-2 text-center">
      {[{ val: pad(h), label: 'saat' }, { val: pad(m), label: 'dak' }, { val: pad(s), label: 'sn' }].map(
        (block, i) => (
          <span key={block.label} className="flex items-center gap-1">
            {i > 0 && <span className="mb-2 text-green-700 font-bold">:</span>}
            <span className="flex flex-col items-center">
              <span className="font-mono text-xl font-bold leading-none text-green-400">{block.val}</span>
              <span className="text-[9px] uppercase tracking-wider text-green-900">{block.label}</span>
            </span>
          </span>
        )
      )}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
const STEP_LABELS = ['Paket', 'E-posta', 'Doğrula', 'Hazır'];
function Stepper({ step }: { step: ModalStep }) {
  const active = Math.min(step, 4);
  return (
    <div className="mb-6 flex items-center justify-center gap-1">
      {STEP_LABELS.map((label, i) => {
        const idx = i + 1;
        const done = active > idx;
        const current = active === idx;
        return (
          <span key={label} className="flex items-center gap-1">
            <span className="flex flex-col items-center gap-0.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  done
                    ? 'bg-purple-600 text-white'
                    : current
                    ? 'border-2 border-purple-500 text-purple-400'
                    : 'border border-gray-700 text-gray-600'
                }`}
              >
                {done ? '✓' : idx}
              </span>
              <span className={`text-[10px] ${current ? 'text-purple-400' : done ? 'text-gray-500' : 'text-gray-700'}`}>
                {label}
              </span>
            </span>
            {i < STEP_LABELS.length - 1 && (
              <span className={`mb-4 h-px w-8 ${done ? 'bg-purple-600' : 'bg-gray-800'}`} />
            )}
          </span>
        );
      })}
    </div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<ModalStep>(1);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [alreadyUsedMsg, setAlreadyUsedMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRecovery, setIsRecovery] = useState(false);

  // ✨ YENİ: başarılı sonrası credential state'i
  const [trialCredentials, setTrialCredentials] = useState<{
    username: string;
    password: string;
    startedAt: number;
  } | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // Modal açıldığında email input'a focus
  useEffect(() => {
    if (step === 2) setTimeout(() => emailInputRef.current?.focus(), 100);
  }, [step]);

  const handleOpenModal = (pkg?: string) => {
    setIsModalOpen(true);
    setStep(1);
    setSelectedPackage(pkg || '');
    setEmail(''); setOtp(''); setOtpToken('');
    setStatusMsg(''); setAlreadyUsedMsg('');
    setResendCooldown(0); setIsRecovery(false);
    setTrialCredentials(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStep(1); setSelectedPackage('');
    setEmail(''); setOtp(''); setOtpToken('');
    setStatusMsg(''); setAlreadyUsedMsg('');
    setLoading(false); setResendCooldown(0); setIsRecovery(false);
    setTrialCredentials(null);
  };

  const handleSendOtp = async (recoveryMode = false) => {
    if (!email) return alert('Lütfen e-posta adresinizi girin.');
    setLoading(true); setStatusMsg('');
    try {
      const res = await fetch('/api/test-talep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', email, selectedPackage }),
      });
      const data = await res.json();
      if (data.alreadyUsed) {
        if (recoveryMode) {
          setIsRecovery(true);
        } else {
          setAlreadyUsedMsg(data.error); setStep(5); return;
        }
      }
      if (data.cooldown) {
        setResendCooldown(data.retryAfter || 60);
        setStatusMsg(data.error);
        return;
      }
      if (data.success) {
        setOtpToken(data.token);
        setIsRecovery(recoveryMode);
        setStep(3);
        setResendCooldown(60);
      } else {
        alert(data.error || 'Kod gönderilemedi.');
      }
    } catch { alert('Sunucuya bağlanılamadı.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return alert('Lütfen doğrulama kodunu girin.');
    setLoading(true);
    setStatusMsg(isRecovery ? 'Bilgileriniz getiriliyor...' : 'Test hesabınız oluşturuluyor, 30-40 saniye sürebilir...');
    try {
      const action = isRecovery ? 'recover' : 'verify';
      const res = await fetch('/api/test-talep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email, otp, token: otpToken }),
      });
      const data = await res.json();
      if (data.alreadyUsed) { setAlreadyUsedMsg(data.error); setStep(5); setStatusMsg(''); return; }
      if (data.success) {
        // ✨ YENİ: credentials'ı state'e kaydet
        setTrialCredentials({
          username: data.username,
          password: data.password,
          startedAt: Date.now(),
        });
        setStep(4);
        setStatusMsg('');
      } else {
        alert(data.error || 'Kod hatalı.');
        setStatusMsg('');
      }
    } catch { alert('Bir hata oluştu.'); setStatusMsg(''); }
    finally { setLoading(false); }
  };

  const m3uLink = trialCredentials
    ? `http://pro4kiptv.xyz:2086/get.php?username=${trialCredentials.username}&password=${trialCredentials.password}&type=m3u&output=ts`
    : '';

  const WaButton = ({ label = '💬 Hemen Satın Al (WhatsApp)' }: { label?: string }) => (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25d366] hover:bg-[#1ebe5d] py-3 font-bold text-white transition-colors"
    >
      {label}
    </a>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold gradient-text">Galya IPTV</Link>
          <div className="hidden items-center gap-6 text-sm text-gray-300 md:flex">
            <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
            <Link href="/#neden-biz" className="transition-colors hover:text-white">Neden Biz</Link>
            <Link href="/#sss" className="transition-colors hover:text-white">S.S.S</Link>
            <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
            <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
            <button onClick={() => handleOpenModal()} className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700">
              Ücretsiz Test
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-20 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-950/50 to-gray-950" />
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-6 inline-block rounded-full border border-purple-700 bg-purple-900/50 px-4 py-1 text-sm text-purple-300">
              4K IPTV Paketleri · Ücretsiz Test · Hızlı Kurulum Desteği
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-6xl">
              <span className="gradient-text">IPTV Al</span> ve 4K Yayın Kalitesini<br className="hidden md:block" /> Güçlü Altyapı ile Keşfet
            </h1>
            <p className="mx-auto mb-10 max-w-3xl text-lg text-gray-300 md:text-xl">
              Galya IPTV ile canlı TV, spor, film ve dizi içeriklerine tek bir üyelikle kolayca erişin.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button onClick={() => handleOpenModal()} className="rounded-xl bg-purple-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-purple-700">
                Ücretsiz Test Al
              </button>
              <Link href="/#paketler" className="rounded-xl border border-purple-500 px-8 py-4 text-lg font-semibold text-purple-300 transition-colors hover:bg-purple-900/30">
                Paketleri İncele
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 text-left md:grid-cols-4">
              {[
                { title: '85.000+', desc: 'Canlı kanal' },
                { title: '4K / Full HD', desc: 'Yüksek görüntü kalitesi' },
                { title: 'Çoklu Cihaz', desc: 'TV, telefon, tablet, PC' },
                { title: 'Destek', desc: 'Kurulum yardımı' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
                  <div className="mb-1 text-xl font-bold gradient-text">{item.title}</div>
                  <div className="text-sm text-gray-400">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Stats ────────────────────────────────────────────────────────── */}
        <section className="border-y border-gray-800 bg-gray-900/50 py-12">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 text-center md:grid-cols-4">
            {[
              { value: '85.000+', label: 'Canlı Kanal' },
              { value: '4K', label: 'Yayın Kalitesi' },
              { value: '7/24', label: 'Destek Hattı' },
              { value: 'Çoklu', label: 'Cihaz Uyumu' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold gradient-text">{s.value}</div>
                <div className="mt-1 text-sm text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Packages ─────────────────────────────────────────────────────── */}
        <section id="paketler" className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">Galya IPTV Paketleri</h2>
            <p className="mx-auto mb-12 max-w-3xl text-center text-gray-400">Size en uygun süreyi seçin, fiyatları karşılaştırın.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <div key={pkg.name} className={`relative flex flex-col rounded-2xl border p-6 ${pkg.popular ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-900/50'}`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-4 py-1 text-xs font-bold text-white">
                      EN POPÜLER
                    </div>
                  )}
                  <div className="mb-1 text-sm text-gray-400">{pkg.duration}</div>
                  <h3 className="mb-2 text-xl font-bold">{pkg.name}</h3>
                  <div className="mb-1 text-4xl font-extrabold">₺{pkg.price}</div>
                  <div className="mb-6 text-sm text-gray-500">tek seferlik ödeme</div>
                  <ul className="mb-8 flex-1 space-y-3">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-green-400">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`https://wa.me/447441921660?text=Merhaba%2C%20${encodeURIComponent(pkg.name)}%20sat%C4%B1n%20almak%20istiyorum.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mb-2 block w-full rounded-xl py-3 text-center font-semibold transition-colors ${pkg.popular ? 'bg-purple-600 text-white hover:bg-purple-700' : 'border border-gray-600 text-gray-300 hover:border-purple-500 hover:text-white'}`}
                  >
                    💬 Satın Al
                  </a>
                  <button
                    onClick={() => handleOpenModal(pkg.name)}
                    className="block w-full rounded-xl border border-purple-800 py-2 text-center text-sm text-purple-400 transition-colors hover:border-purple-500 hover:text-purple-300"
                  >
                    Ücretsiz Test Al
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Neden Biz ────────────────────────────────────────────────────── */}
        <section id="neden-biz" className="bg-gray-900/30 px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">Neden Galya IPTV?</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: '📺', title: 'Geniş İçerik', desc: 'Canlı TV, spor, belgesel, film ve dizi kategorilerinde zengin içerik.' },
                { icon: '🎯', title: '4K ve Full HD', desc: 'Destekleyen cihazlarda daha net izleme deneyimi.' },
                { icon: '⚡', title: 'Güçlü Altyapı', desc: 'Stabil kullanım hedefiyle optimize edilmiş yayın yapısı.' },
                { icon: '🛡️', title: 'Kurulum Yardımı', desc: 'Uygulama seçimi ve temel ayarlarda destek.' },
                { icon: '📱', title: 'Tüm Cihazlar', desc: 'Smart TV, mobil, TV Box, bilgisayar ve daha fazlası.' },
                { icon: '🆓', title: 'Önce Test', desc: 'Satın almadan önce deneyerek karar ver.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-purple-800">
                  <div className="mb-3 text-3xl">{item.icon}</div>
                  <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SSS ──────────────────────────────────────────────────────────── */}
        <section id="sss" className="px-4 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">Sıkça Sorulan Sorular</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-gray-800 bg-gray-900 p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                    {faq.q}
                    <span className="text-purple-400 transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-gray-400">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ──────────────────────────────────────────────────────────── */}
        <section className="bg-gray-900/30 px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Size Uygun Paketi Hemen Seçin</h2>
            <p className="mb-8 text-gray-400">Ücretsiz test isteyin ve kurulum desteği ile hızlıca başlayın.</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button onClick={() => handleOpenModal()} className="inline-block rounded-xl bg-green-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-green-700">
                E-posta ile Test Talep Et
              </button>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl bg-[#25d366] px-10 py-4 text-lg font-bold text-white transition-colors hover:bg-[#1ebe5d]">
                💬 WhatsApp ile Satın Al
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 px-4 py-10 text-center text-sm text-gray-500">
        <p className="mb-2 font-semibold text-gray-300">Galya IPTV</p>
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
        <div className="mt-4 flex justify-center gap-6">
          <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
          <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
          <Link href="/#sss" className="transition-colors hover:text-white">S.S.S</Link>
          <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
        </div>
      </footer>

      {/* ─── Modal ────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div className="w-full max-w-md rounded-2xl border border-purple-500 bg-gray-950 p-6 shadow-[0_0_30px_rgba(147,51,234,0.3)]">
            {/* Kapat */}
            <button
              onClick={handleCloseModal}
              className="float-right text-xl font-bold text-gray-600 hover:text-white"
            >
              ✕
            </button>

            {/* Stepper (adım 4 ve 5'te gösterme) */}
            {step !== 5 && <Stepper step={step} />}

            {/* ── ADIM 1: Paket seç ─────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">Ücretsiz Test Al</h3>
                <p className="text-sm text-gray-400">Hangi paketi düşünüyorsunuz? <span className="text-gray-600">(İsteğe bağlı)</span></p>
                <div className="space-y-2">
                  {modalPackages.map((pkg) => (
                    <button
                      key={pkg.label}
                      onClick={() => setSelectedPackage(pkg.label)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                        selectedPackage === pkg.label
                          ? 'border-purple-500 bg-purple-900/30 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                      }`}
                    >
                      {/* Checkbox circle */}
                      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                        selectedPackage === pkg.label ? 'border-purple-500 bg-purple-600 text-white' : 'border-gray-600'
                      }`}>
                        {selectedPackage === pkg.label ? '✓' : ''}
                      </span>
                      <span className={pkg.label === 'Henüz bilmiyorum' ? 'italic text-gray-500' : ''}>
                        {pkg.label}
                      </span>
                      {pkg.popular && (
                        <span className="ml-1 rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          POPÜLER
                        </span>
                      )}
                      {pkg.price && (
                        <span className="ml-auto font-bold text-purple-400">{pkg.price}</span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl bg-purple-600 py-3 font-bold text-white transition-colors hover:bg-purple-700"
                >
                  Devam Et →
                </button>
                <div className="border-t border-gray-800 pt-3">
                  <WaButton />
                </div>
              </div>
            )}

            {/* ── ADIM 2: Email ─────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">E-posta Adresiniz</h3>
                {selectedPackage && selectedPackage !== 'Henüz bilmiyorum' && (
                  <div className="rounded-xl border border-purple-800/50 bg-purple-900/20 px-4 py-2 text-sm text-purple-300">
                    📦 {selectedPackage}
                  </div>
                )}
                <p className="text-sm text-gray-400">Test bilgilerini göndereceğimiz e-posta adresinizi girin.</p>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="ornek@email.com"
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none transition-colors focus:border-purple-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                />
                <p className="text-xs text-gray-600">Geçici e-posta adresleri kabul edilmemektedir.</p>
                <button
                  onClick={() => handleSendOtp(false)}
                  disabled={loading}
                  className="w-full rounded-xl bg-purple-600 py-3 font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                </button>
                {statusMsg && <p className="text-center text-xs text-yellow-400">{statusMsg}</p>}
                <button onClick={() => setStep(1)} className="w-full text-sm text-gray-600 transition-colors hover:text-gray-300">
                  ← Geri dön
                </button>
                <button
                  onClick={() => handleSendOtp(true)}
                  disabled={loading}
                  className="w-full text-xs text-purple-600 transition-colors hover:text-purple-400"
                >
                  Test bilgilerimi daha önce aldım, tekrar görmek istiyorum →
                </button>
                <div className="border-t border-gray-800 pt-3">
                  <WaButton />
                </div>
              </div>
            )}

            {/* ── ADIM 3: OTP ───────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4 text-center">
                <h3 className="text-2xl font-bold text-white">Kodu Doğrula</h3>
                <p className="text-sm text-gray-400">
                  <strong className="text-white">{email}</strong> adresine gönderilen 6 haneli kodu girin.
                </p>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-center font-mono text-3xl font-bold tracking-[10px] text-white outline-none transition-colors focus:border-purple-500"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />
                <p className="text-xs text-gray-600">Spam klasörünü de kontrol edin.</p>
                {statusMsg && <p className="text-xs font-medium text-purple-400">{statusMsg}</p>}
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full rounded-xl bg-green-600 py-3 font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Lütfen Bekleyin...' : 'Onayla ve Testi Aç'}
                </button>
                <button
                  onClick={() => handleSendOtp(isRecovery)}
                  disabled={loading || resendCooldown > 0}
                  className="w-full text-sm text-gray-500 transition-colors hover:text-gray-300 disabled:text-gray-700"
                >
                  {resendCooldown > 0 ? `Yeni kod: ${resendCooldown}s` : 'Kodu tekrar gönder'}
                </button>
                <button
                  onClick={() => { setStep(2); setOtp(''); }}
                  className="w-full text-xs text-gray-600 transition-colors hover:text-gray-400"
                >
                  ← Geri dön
                </button>
                <div className="border-t border-gray-800 pt-3">
                  <WaButton />
                </div>
              </div>
            )}

            {/* ── ADIM 4: Başarılı + Inline Credentials ─────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl">✅</div>
                  <h3 className="mt-2 text-2xl font-bold text-white">
                    {isRecovery ? 'Bilgileriniz Hazır' : 'Testiniz Açıldı!'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Bilgiler <strong className="text-white">{email}</strong> adresine de gönderildi.
                  </p>
                </div>

                {trialCredentials && (
                  <div className="rounded-xl border border-purple-900/60 bg-black/40 p-4">
                    {/* Aktif badge + geri sayım */}
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                        </span>
                        <span className="text-xs font-semibold text-green-400">Aktif Test Hesabı</span>
                      </div>
                      <Countdown startedAt={trialCredentials.startedAt} />
                    </div>

                    {/* Credential satırları */}
                    <div className="space-y-0 divide-y divide-gray-800/60">
                      {/* Sunucu */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-gray-500">Sunucu</span>
                        <div className="flex items-center">
                          <span className="font-mono text-xs text-purple-400">pro4kiptv.xyz:2086</span>
                          <CopyButton value="http://pro4kiptv.xyz:2086/" />
                        </div>
                      </div>
                      {/* Kullanıcı Adı */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-gray-500">Kullanıcı Adı</span>
                        <div className="flex items-center">
                          <span className="rounded bg-purple-950 px-2 py-0.5 font-mono text-sm font-bold text-purple-300">
                            {trialCredentials.username}
                          </span>
                          <CopyButton value={trialCredentials.username} />
                        </div>
                      </div>
                      {/* Şifre */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-gray-500">Şifre</span>
                        <div className="flex items-center">
                          <span className="rounded bg-purple-950 px-2 py-0.5 font-mono text-sm font-bold text-purple-300">
                            {trialCredentials.password}
                          </span>
                          <CopyButton value={trialCredentials.password} />
                        </div>
                      </div>
                    </div>

                    {/* M3U linki */}
                    <div className="mt-3 rounded-lg border border-gray-800 bg-gray-900/50 p-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-gray-600">M3U Linki</span>
                        <CopyButton value={m3uLink} />
                      </div>
                      <p className="break-all font-mono text-[10px] leading-relaxed text-gray-500">{m3uLink}</p>
                    </div>

                    {/* Önerilen uygulamalar */}
                    <div className="mt-3 flex gap-2">
                      {['IPTV Smarters', 'TiviMate', 'Hot IPTV'].map((app) => (
                        <span key={app} className="flex-1 rounded-lg border border-gray-800 py-1 text-center text-[10px] text-gray-500">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <WaButton label="💬 Beğendiyseniz Satın Alın" />
                <button
                  onClick={handleCloseModal}
                  className="w-full rounded-lg border border-gray-800 py-2 text-sm text-gray-500 transition-colors hover:border-gray-600 hover:text-gray-300"
                >
                  Pencereyi Kapat
                </button>
              </div>
            )}

            {/* ── ADIM 5: Daha önce test alındı ────────────────────────── */}
            {step === 5 && (
              <div className="space-y-4 py-4 text-center">
                <div className="text-5xl">⏳</div>
                <h3 className="text-2xl font-bold text-white">Daha Önce Test Aldınız</h3>
                <p className="text-sm leading-relaxed text-gray-400">{alreadyUsedMsg}</p>
                <WaButton label="💬 WhatsApp ile Satın Al" />
                <button
                  onClick={() => { setStep(1); setEmail(''); setAlreadyUsedMsg(''); }}
                  className="w-full text-sm text-gray-600 transition-colors hover:text-gray-400"
                >
                  Farklı e-posta ile dene
                </button>
                <button onClick={handleCloseModal} className="w-full text-sm text-gray-600 transition-colors hover:text-gray-400">
                  Kapat
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
