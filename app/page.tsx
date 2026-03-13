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
  { label: '1 Aylık Paket', price: '₺500' },
  { label: '3 Aylık Paket', price: '₺700', popular: true },
  { label: '6 Aylık Paket', price: '₺1.000' },
  { label: '12 Aylık Paket', price: '₺1.400' },
  { label: '24 Aylık Paket', price: '₺2.200' },
  { label: 'Süresiz Paket', price: '₺6.900' },
  { label: 'Henüz bilmiyorum', price: '' },
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
          ? 'border-emerald-600 text-emerald-400'
          : 'border-white/10 text-zinc-600 hover:border-[#7c3aed]/50 hover:text-[#a78bfa]'
      }`}
    >
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
const STEP_LABELS = ['Paket', 'E-posta', 'Doğrula', 'Hazır'];
function Stepper({ step }: { step: ModalStep }) {
  const active = Math.min(step, 4);
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
                done ? 'bg-[#7c3aed] text-white'
                  : current ? 'border-2 border-[#7c3aed] text-[#a78bfa]'
                  : 'border border-white/10 text-zinc-700'
              }`}>
                {done ? '✓' : idx}
              </span>
              <span className={`text-[9px] ${current ? 'text-[#a78bfa]' : done ? 'text-zinc-600' : 'text-zinc-800'}`}>
                {label}
              </span>
            </span>
            {i < STEP_LABELS.length - 1 && (
              <span className={`mb-4 h-px w-8 ${done ? 'bg-[#7c3aed]' : 'bg-white/5'}`} />
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
  const [trialCredentials, setTrialCredentials] = useState<{
    username: string; password: string; startedAt: number;
  } | null>(null);

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
        if (recoveryMode) { setIsRecovery(true); }
        else { setAlreadyUsedMsg(data.error); setStep(5); return; }
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
    setStatusMsg(isRecovery ? 'Bilgileriniz getiriliyor...' : 'Test hesabınız oluşturuluyor, 30–40 saniye sürebilir...');
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
        setTrialCredentials({ username: data.username, password: data.password, startedAt: Date.now() });
        setStep(4); setStatusMsg('');
      } else { alert(data.error || 'Kod hatalı.'); setStatusMsg(''); }
    } catch { alert('Bir hata oluştu.'); setStatusMsg(''); }
    finally { setLoading(false); }
  };

  const m3uLink = trialCredentials
    ? `http://pro4kiptv.xyz:2086/get.php?username=${trialCredentials.username}&password=${trialCredentials.password}&type=m3u&output=ts`
    : '';

  const WaButton = ({ label = '💬 WhatsApp ile Satın Al' }: { label?: string }) => (
    <a
      href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 font-semibold text-white transition-colors hover:bg-[#1ebe5d]"
    >
      {label}
    </a>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#09090b]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Galya <span className="text-[#7c3aed]">IPTV</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex">
            <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
            <Link href="/#neden-biz" className="transition-colors hover:text-white">Neden Biz</Link>
            <Link href="/#sss" className="transition-colors hover:text-white">S.S.S</Link>
            <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
            <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
            <button
              onClick={() => handleOpenModal()}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
            >
              Ücretsiz Test
            </button>
          </div>
        </nav>
      </header>

      <main className="bg-[#09090b] text-white">

        {/* ─── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-80 w-80 rounded-full bg-[#7c3aed]/8 blur-3xl" />
          <div className="relative mx-auto max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-1.5 text-xs text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              4K Yayın · 85.000+ Kanal · Türkiye'ye Özel Destek
            </div>
            <h1 className="mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              Türkiye'nin En Kaliteli
              <br />
              <span className="text-[#7c3aed]">IPTV Hizmeti</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
              Canlı TV, spor, film ve dizi — tek üyelikle tüm cihazlarda.
              Satın almadan önce ücretsiz test alın.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => handleOpenModal()}
                className="w-full sm:w-auto rounded-xl bg-[#7c3aed] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#7c3aed]/20 transition-colors hover:bg-[#6d28d9]"
              >
                Ücretsiz Test Al
              </button>
              <Link
                href="/#paketler"
                className="w-full sm:w-auto rounded-xl border border-white/10 px-8 py-3.5 text-base font-semibold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Fiyatlara Bak →
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { v: '85.000+', l: 'Canlı Kanal' },
                { v: '4K / FHD', l: 'Görüntü Kalitesi' },
                { v: 'Çoklu', l: 'Cihaz Desteği' },
                { v: '7/24', l: 'Teknik Destek' },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left">
                  <div className="text-lg font-bold text-white">{s.v}</div>
                  <div className="mt-0.5 text-xs text-zinc-600">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Packages ──────────────────────────────────────────────────────── */}
        <section id="paketler" className="border-t border-white/5 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Paket Seçenekleri</h2>
              <p className="mt-3 text-sm text-zinc-500">Tek seferlik ödeme, abonelik yok.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-colors ${
                    pkg.popular
                      ? 'border-[#7c3aed]/50 bg-[#7c3aed]/5'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#7c3aed] px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                      Popüler
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-xs font-medium uppercase tracking-widest text-zinc-600">{pkg.duration}</div>
                    <h3 className="mt-1 text-lg font-bold text-white">{pkg.name}</h3>
                  </div>
                  <div className="mb-5">
                    <span className="text-4xl font-extrabold text-white">₺{pkg.price}</span>
                    <span className="ml-1.5 text-sm text-zinc-600">tek ödeme</span>
                  </div>
                  <ul className="mb-6 flex-1 space-y-2.5">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-400">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`https://wa.me/447441921660?text=Merhaba%2C%20${encodeURIComponent(pkg.name)}%20sat%C4%B1n%20almak%20istiyorum.`}
                    target="_blank" rel="noopener noreferrer"
                    className={`mb-2 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                      pkg.popular
                        ? 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]'
                        : 'border border-white/8 text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    💬 WhatsApp ile Satın Al
                  </a>
                  <button
                    onClick={() => handleOpenModal(pkg.name)}
                    className="w-full rounded-xl py-2 text-center text-xs text-zinc-600 transition-colors hover:text-zinc-400"
                  >
                    Önce ücretsiz test al
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Neden Biz ─────────────────────────────────────────────────────── */}
        <section id="neden-biz" className="border-t border-white/5 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">Neden Galya IPTV?</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: '📺', title: 'Geniş İçerik', desc: 'Canlı TV, spor, belgesel, film ve dizi kategorilerinde zengin içerik.' },
                { icon: '🎯', title: '4K ve Full HD', desc: 'Destekleyen cihazlarda daha net izleme deneyimi.' },
                { icon: '⚡', title: 'Güçlü Altyapı', desc: 'Stabil kullanım hedefiyle optimize edilmiş yayın yapısı.' },
                { icon: '🛡️', title: 'Kurulum Yardımı', desc: 'Uygulama seçimi ve temel ayarlarda destek.' },
                { icon: '📱', title: 'Tüm Cihazlar', desc: 'Smart TV, mobil, TV Box, bilgisayar ve daha fazlası.' },
                { icon: '🆓', title: 'Önce Test', desc: 'Satın almadan önce deneyerek karar ver.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-white/10">
                  <div className="mb-3 text-2xl">{item.icon}</div>
                  <h3 className="mb-1.5 font-semibold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SSS ───────────────────────────────────────────────────────────── */}
        <section id="sss" className="border-t border-white/5 px-6 py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-10 text-center text-3xl font-bold tracking-tight md:text-4xl">Sıkça Sorulan Sorular</h2>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-zinc-200">
                    {faq.q}
                    <span className="shrink-0 text-[10px] text-zinc-700 transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ───────────────────────────────────────────────────────────── */}
        <section className="border-t border-white/5 px-6 py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">Hemen Başlayın</h2>
            <p className="mb-8 text-sm text-zinc-500">Ücretsiz test talep edin veya WhatsApp üzerinden bize ulaşın.</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => handleOpenModal()}
                className="rounded-xl bg-[#7c3aed] px-8 py-3.5 font-semibold text-white shadow-lg shadow-[#7c3aed]/20 transition-colors hover:bg-[#6d28d9]"
              >
                Ücretsiz Test Al
              </button>
              <a
                href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="rounded-xl bg-[#25d366] px-8 py-3.5 font-semibold text-white transition-colors hover:bg-[#1ebe5d]"
              >
                💬 WhatsApp ile İletişim
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#09090b] px-6 py-10 text-center text-sm text-zinc-700">
        <p className="mb-1 font-semibold text-zinc-500">Galya IPTV</p>
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
        <div className="mt-5 flex justify-center gap-6 text-xs">
          <Link href="/blog" className="transition-colors hover:text-zinc-300">Blog</Link>
          <Link href="/#paketler" className="transition-colors hover:text-zinc-300">Paketler</Link>
          <Link href="/#sss" className="transition-colors hover:text-zinc-300">S.S.S</Link>
          <Link href="/iletisim" className="transition-colors hover:text-zinc-300">İletişim</Link>
        </div>
      </footer>

      {/* ─── Modal ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111113] p-6 shadow-2xl">
            <button
              onClick={handleCloseModal}
              className="float-right text-zinc-600 transition-colors hover:text-zinc-300"
            >
              ✕
            </button>

            {step !== 5 && <Stepper step={step} />}

            {/* ── ADIM 1: Paket seç ──────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-white">Ücretsiz Test Al</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Hangi paketi düşünüyorsunuz? <span className="text-zinc-700">(İsteğe bağlı)</span>
                  </p>
                </div>
                <div className="space-y-1.5">
                  {modalPackages.map((pkg) => (
                    <button
                      key={pkg.label}
                      onClick={() => setSelectedPackage(pkg.label)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                        selectedPackage === pkg.label
                          ? 'border-[#7c3aed]/60 bg-[#7c3aed]/10 text-white'
                          : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                        selectedPackage === pkg.label
                          ? 'border-[#7c3aed] bg-[#7c3aed] text-white'
                          : 'border-white/10'
                      }`}>
                        {selectedPackage === pkg.label ? '✓' : ''}
                      </span>
                      <span className={pkg.label === 'Henüz bilmiyorum' ? 'italic text-zinc-600' : ''}>
                        {pkg.label}
                      </span>
                      {pkg.popular && (
                        <span className="rounded bg-[#7c3aed] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          POPÜLER
                        </span>
                      )}
                      {pkg.price && (
                        <span className="ml-auto font-semibold text-zinc-400">{pkg.price}</span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl bg-[#7c3aed] py-3 font-semibold text-white transition-colors hover:bg-[#6d28d9]"
                >
                  Devam Et →
                </button>
                <div className="border-t border-white/5 pt-3">
                  <WaButton />
                </div>
              </div>
            )}

            {/* ── ADIM 2: Email ──────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">E-posta Adresiniz</h3>
                  <p className="mt-1 text-sm text-zinc-500">Test bilgilerini göndereceğimiz e-posta adresinizi girin.</p>
                </div>
                {selectedPackage && selectedPackage !== 'Henüz bilmiyorum' && (
                  <div className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-zinc-500">
                    📦 {selectedPackage}
                  </div>
                )}
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="ornek@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition-colors focus:border-[#7c3aed]/60"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                />
                <p className="text-xs text-zinc-700">Geçici e-posta adresleri kabul edilmemektedir.</p>
                <button
                  onClick={() => handleSendOtp(false)}
                  disabled={loading}
                  className="w-full rounded-xl bg-[#7c3aed] py-3 font-semibold text-white transition-colors hover:bg-[#6d28d9] disabled:opacity-50"
                >
                  {loading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                </button>
                {statusMsg && <p className="text-center text-xs text-amber-400">{statusMsg}</p>}
                <div className="flex justify-between text-xs">
                  <button onClick={() => setStep(1)} className="text-zinc-600 transition-colors hover:text-zinc-400">← Geri dön</button>
                  <button onClick={() => handleSendOtp(true)} disabled={loading} className="text-zinc-600 transition-colors hover:text-zinc-400">
                    Daha önce test aldım →
                  </button>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <WaButton />
                </div>
              </div>
            )}

            {/* ── ADIM 3: OTP ────────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4 text-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Kodu Doğrula</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    <span className="text-zinc-300">{email}</span> adresine gönderilen 6 haneli kodu girin.
                  </p>
                </div>
                <input
                  type="text" placeholder="000000" maxLength={6} inputMode="numeric"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-center font-mono text-3xl font-bold tracking-[10px] text-white outline-none transition-colors focus:border-[#7c3aed]/60"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                />
                <p className="text-xs text-zinc-700">Spam klasörünü de kontrol edin.</p>
                {statusMsg && <p className="text-xs text-zinc-400">{statusMsg}</p>}
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
                >
                  {loading ? 'Lütfen Bekleyin...' : 'Onayla ve Testi Aç'}
                </button>
                <div className="flex justify-between text-xs">
                  <button onClick={() => { setStep(2); setOtp(''); }} className="text-zinc-700 transition-colors hover:text-zinc-400">← Geri dön</button>
                  <button
                    onClick={() => handleSendOtp(isRecovery)}
                    disabled={loading || resendCooldown > 0}
                    className="text-zinc-700 transition-colors hover:text-zinc-400 disabled:text-zinc-800"
                  >
                    {resendCooldown > 0 ? `Tekrar gönder (${resendCooldown}s)` : 'Tekrar gönder'}
                  </button>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <WaButton />
                </div>
              </div>
            )}

            {/* ── ADIM 4: Başarılı + Inline Credentials ──────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">✅</div>
                  <h3 className="text-xl font-bold text-white">
                    {isRecovery ? 'Bilgileriniz Hazır' : 'Testiniz Açıldı!'}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Bilgiler <span className="text-zinc-300">{email}</span> adresine de gönderildi.
                  </p>
                </div>

                {trialCredentials && (
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
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
                        <span className="text-xs text-zinc-600">Sunucu</span>
                        <div className="flex items-center">
                          <span className="font-mono text-xs text-zinc-400">pro4kiptv.xyz:2086</span>
                          <CopyButton value="http://pro4kiptv.xyz:2086/" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-zinc-600">Kullanıcı Adı</span>
                        <div className="flex items-center">
                          <span className="rounded-md bg-[#7c3aed]/10 px-2 py-0.5 font-mono text-sm font-bold text-[#a78bfa]">
                            {trialCredentials.username}
                          </span>
                          <CopyButton value={trialCredentials.username} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-zinc-600">Şifre</span>
                        <div className="flex items-center">
                          <span className="rounded-md bg-[#7c3aed]/10 px-2 py-0.5 font-mono text-sm font-bold text-[#a78bfa]">
                            {trialCredentials.password}
                          </span>
                          <CopyButton value={trialCredentials.password} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-700">M3U Linki</span>
                        <CopyButton value={m3uLink} />
                      </div>
                      <p className="break-all font-mono text-[10px] leading-relaxed text-zinc-600">{m3uLink}</p>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {['IPTV Smarters', 'TiviMate', 'Hot IPTV'].map((app) => (
                        <span key={app} className="flex-1 rounded-lg border border-white/5 py-1 text-center text-[10px] text-zinc-700">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <WaButton label="💬 Beğendiyseniz Satın Alın" />
                <button
                  onClick={handleCloseModal}
                  className="w-full rounded-lg border border-white/5 py-2.5 text-sm text-zinc-600 transition-colors hover:border-white/10 hover:text-zinc-300"
                >
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
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{alreadyUsedMsg}</p>
                </div>
                <WaButton label="💬 WhatsApp ile Satın Al" />
                <button
                  onClick={() => { setStep(1); setEmail(''); setAlreadyUsedMsg(''); }}
                  className="w-full text-xs text-zinc-700 transition-colors hover:text-zinc-400"
                >
                  Farklı e-posta ile dene
                </button>
                <button onClick={handleCloseModal} className="w-full text-xs text-zinc-700 transition-colors hover:text-zinc-400">
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
