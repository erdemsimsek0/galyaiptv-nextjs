import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'İletişim | GalyaStream 7/24 WhatsApp Destek',
  description:
    'GalyaStream ile 7/24 WhatsApp destek hattı üzerinden iletişime geçin. Ücretsiz IPTV test yayını, teknik destek ve kurulum yardımı için hemen ulaşın.',
  keywords: [
    'GalyaStream iletişim',
    'IPTV WhatsApp destek',
    'ücretsiz IPTV test',
    'IPTV müşteri hizmetleri',
    '7/24 IPTV destek',
  ],
  alternates: { canonical: 'https://www.galyastream.com/iletisim' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'İletişim | GalyaStream 7/24 WhatsApp Destek',
    description:
      'GalyaStream müşteri hizmetleri ile 7/24 WhatsApp üzerinden iletişime geçin.',
    url: 'https://www.galyastream.com/iletisim',
    siteName: 'GalyaStream',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'İletişim | GalyaStream 7/24 WhatsApp Destek',
    description: 'GalyaStream ile ücretsiz test yayını alın, 7/24 WhatsApp destek hattımıza ulaşın.',
  },
};

const WHATSAPP_BASE = 'https://wa.me/447441921660';
const SURFACE = {
  page: 'bg-[#07111f] text-white',
  section: 'border-t border-[#1e3a5f] bg-[#0d1117]',
  card: 'rounded-2xl border border-[#1e3a5f] bg-[#111827] shadow-[0_20px_60px_rgba(3,7,18,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3b82f6]/60 hover:shadow-[0_24px_70px_rgba(59,130,246,0.14)]',
  pill: 'rounded-full border border-[#1e3a5f] bg-[#0d1a2a] text-[#9ca3af]',
};
const NAV_LINK_CLASS = 'rounded-xl px-4 py-1.5 text-sm font-medium text-[#8b9ab3] transition-colors hover:bg-[#162035] hover:text-white';
const PRIMARY_BUTTON_CLASS = 'rounded-xl bg-[#6366f1] px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-[#6366f1]/25 transition-all hover:scale-[1.02] hover:bg-[#4f46e5]';
const SECONDARY_BUTTON_CLASS = 'rounded-xl border border-[#1e3a5f] bg-[#111827] px-6 py-3 text-sm font-semibold text-white transition-all hover:border-[#3b82f6]/50 hover:bg-[#162035]';
const INLINE_ACCENT_CLASS = 'text-[#818cf8]';

const contactSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'GalyaStream İletişim',
  url: 'https://www.galyastream.com/iletisim',
  description: '7/24 WhatsApp destek, ücretsiz IPTV test yayını ve teknik destek',
  mainEntity: {
    '@type': 'Organization',
    name: 'GalyaStream',
    url: 'https://www.galyastream.com',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${WHATSAPP_BASE}`,
        availableLanguage: ['Turkish'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59',
        },
      },
    ],
  },
};

export default function ContactPage() {
  const whatsappSupport = `${WHATSAPP_BASE}?text=Merhaba%2C%20destek%20almak%20istiyorum`;
  const whatsappTest = `${WHATSAPP_BASE}?text=Merhaba%2C%20%C3%BCcretsiz%20IPTV%20testi%20almak%20istiyorum`;
  const whatsappBuy = `${WHATSAPP_BASE}?text=Merhaba%2C%20IPTV%20sat%C4%B1n%20almak%20istiyorum`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />

      <div className={`min-h-screen ${SURFACE.page}`}>
        <header className="sticky top-0 z-50 border-b border-[#1e3a5f] bg-[#07111f]/90 backdrop-blur-md">
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="text-lg font-bold tracking-tight text-white">
              Galya<span className={INLINE_ACCENT_CLASS}>Stream</span>
            </Link>
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/#paketler" className={NAV_LINK_CLASS}>Paketler</Link>
              <Link href="/blog" className={NAV_LINK_CLASS}>Blog</Link>
              <Link href="/iletisim" className="rounded-xl bg-[#162035] px-4 py-1.5 text-sm font-medium text-white" aria-current="page">İletişim</Link>
              <Link href="/araclar" className={NAV_LINK_CLASS}>Araçlar</Link>
            </div>
            <a href={whatsappTest} target="_blank" rel="noopener noreferrer" className="hidden rounded-xl border border-[#1e3a5f] bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition-all hover:border-[#3b82f6]/50 hover:bg-[#162035] md:inline-flex">
              Ücretsiz Test
            </a>
          </nav>
        </header>

        <main>
          <section className="relative overflow-hidden px-6 pb-20 pt-16 text-center">
            <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[520px] rounded-full bg-[#1e3a5f]/25 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-8 h-[340px] w-[420px] rounded-full bg-[#2563eb]/10 blur-3xl" />
            <div className="relative mx-auto max-w-3xl">
              <div className={`mb-5 inline-flex items-center gap-2 px-4 py-1.5 text-xs ${SURFACE.pill}`}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                7/24 aktif destek · Ortalama yanıt 2 dakika
              </div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
                Teknik destek, ücretsiz test ve paket danışmanlığı tek ekranda
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-[#9ca3af] md:text-lg">
                İletişim sayfasını da ana sayfadaki mavi/lacivert tasarım sistemiyle hizaladık. Kurulum, test yayını,
                satın alma veya destek için doğru aksiyona tek tıkla ulaşın.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <a href={whatsappSupport} target="_blank" rel="noopener noreferrer" className={`${PRIMARY_BUTTON_CLASS} flex items-center justify-center gap-2`}>
                  💬 WhatsApp Destek
                </a>
                <Link href="/blog" className={`${SECONDARY_BUTTON_CLASS} flex items-center justify-center gap-2`}>
                  📚 Blog Rehberlerini Oku
                </Link>
              </div>
            </div>
          </section>

          <section className={`px-6 py-16 ${SURFACE.section}`}>
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">Hızlı aksiyonlar</p>
                <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">İhtiyacınıza göre doğru kanalı seçin</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                <article className={`flex flex-col p-6 ${SURFACE.card}`}>
                  <div className="mb-4 text-3xl">💬</div>
                  <h2 className="mb-2 text-lg font-bold text-white">WhatsApp Destek</h2>
                  <p className="mb-5 flex-1 text-sm leading-7 text-[#9ca3af]">
                    Kurulum, donma, bağlantı veya hesap sorunları için en hızlı iletişim kanalımız.
                  </p>
                  <a href={whatsappSupport} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5d]">
                    💬 Desteğe Yaz
                  </a>
                </article>
                <article className={`flex flex-col p-6 ${SURFACE.card}`}>
                  <div className="mb-4 text-3xl">🆓</div>
                  <h2 className="mb-2 text-lg font-bold text-white">Ücretsiz Test</h2>
                  <p className="mb-5 flex-1 text-sm leading-7 text-[#9ca3af]">
                    Satın almadan önce kaliteyi görün. Test yayınıyla cihaz uyumunu ve yayın akıcılığını ölçün.
                  </p>
                  <a href={whatsappTest} target="_blank" rel="noopener noreferrer" className={`${PRIMARY_BUTTON_CLASS} flex items-center justify-center gap-2 px-4 py-3`}>
                    ⚡ Test Talep Et
                  </a>
                </article>
                <article className={`flex flex-col p-6 ${SURFACE.card}`}>
                  <div className="mb-4 text-3xl">🛒</div>
                  <h2 className="mb-2 text-lg font-bold text-white">Paket Satın Al</h2>
                  <p className="mb-5 flex-1 text-sm leading-7 text-[#9ca3af]">
                    İhtiyacınıza uygun paketi seçin, sonrasında WhatsApp üzerinden hızlıca satın alma desteği alın.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link href="/#paketler" className={`${SECONDARY_BUTTON_CLASS} flex items-center justify-center gap-2 px-4 py-3`}>
                      Paketleri İncele
                    </Link>
                    <a href={whatsappBuy} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-[#1e3a5f] bg-[#111827] py-3 text-sm font-semibold text-[#25d366] transition-all hover:border-[#25d366]/40 hover:bg-[#25d366]/5">
                      💬 Satın Alma Desteği
                    </a>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section className={`px-6 py-14 ${SURFACE.section}`}>
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10">
              {[
                { icon: '🕐', label: 'Destek Saatleri', value: '7/24, her gün' },
                { icon: '⚡', label: 'Ort. Yanıt Süresi', value: '~2 dakika' },
                { icon: '📦', label: 'Test Teslimatı', value: 'Anında' },
                { icon: '🌐', label: 'Dil', value: 'Türkçe' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#1e3a5f] bg-[#111827] px-5 py-4 text-center shadow-[0_14px_40px_rgba(3,7,18,0.22)]">
                  <div className="mb-1 text-xl">{item.icon}</div>
                  <div className="text-xs text-[#8b9ab3]">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className={`px-6 py-16 ${SURFACE.section}`}>
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 text-center">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">Sık sorulan sorular</p>
                <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">İletişim ve test süreci hakkında merak edilenler</h2>
              </div>
              <div className="space-y-3">
                {[
                  {
                    q: 'Test yayını ücretsiz mi?',
                    a: 'Evet, 12 saatlik test yayını tamamen ücretsizdir. Kredi kartı bilgisi gerekmez.',
                  },
                  {
                    q: 'WhatsApp dışında iletişim kanalınız var mı?',
                    a: 'Şu an için birincil destek kanalımız WhatsApp\'tır. Hızlı çözüm için bu kanal önerilir.',
                  },
                  {
                    q: 'Teknik sorunum var, ne yapmalıyım?',
                    a: 'WhatsApp hattımıza yazın. Kurulum, donma ve bağlantı sorunları için adım adım destek veriyoruz.',
                  },
                  {
                    q: 'Satın alma sonrası ne kadar sürede kurulum yapılır?',
                    a: 'Ödeme onaylandıktan sonra bilgileriniz anında iletilir. WhatsApp desteğiyle kurulum süreci hızla tamamlanır.',
                  },
                ].map((faq) => (
                  <details key={faq.q} className="group rounded-2xl border border-[#1e3a5f] bg-[#111827] px-5 py-4 transition-colors hover:border-[#3b82f6]/50">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white">
                      {faq.q}
                      <span className="shrink-0 text-[10px] text-[#6b7280] transition-transform group-open:rotate-180">▼</span>
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-[#9ca3af]">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className={`px-6 py-20 ${SURFACE.section}`}>
            <div className="mx-auto max-w-3xl text-center">
              <div className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-8 shadow-[0_24px_70px_rgba(3,7,18,0.4)] md:p-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3730a3] bg-[#1e1b4b] px-4 py-1.5 text-xs text-[#818cf8]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#818cf8]" />
                  İç linkler ve dönüşüm akışı
                </div>
                <h2 className="mb-3 text-2xl font-bold tracking-tight text-white md:text-4xl">Sonraki adım için doğru sayfaya geçin</h2>
                <p className="mx-auto mb-8 max-w-xl text-sm leading-7 text-[#9ca3af] md:text-base">
                  Paketleri inceleyin, blog rehberlerini okuyun veya doğrudan ücretsiz test talep edin. Böylece iletişim sayfası ana sayfadaki yönlendirme diliyle aynı kalır.
                </p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                  <Link href="/#paketler" className={PRIMARY_BUTTON_CLASS}>Paketleri İncele</Link>
                  <Link href="/blog" className={SECONDARY_BUTTON_CLASS}>Blog&apos;u Oku</Link>
                  <Link href="/blog/iptv-nedir" className={SECONDARY_BUTTON_CLASS}>IPTV Nedir?</Link>
                  <a href={whatsappTest} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1ebe5d]">
                    💬 Ücretsiz Test Al
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-[#1e3a5f] bg-[#0d1117] px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-5xl px-0">
            <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
              <div>
                <p className="text-lg font-bold text-white">Galya<span className={INLINE_ACCENT_CLASS}>Stream</span></p>
                <p className="mt-1 text-xs text-[#6b7280]">Kesintisiz, kristal netliğinde yayın — her ekranda</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                <span className="text-amber-400">★★★★★</span>
                <span className="font-semibold text-white">4.9</span>
                <span>· 1.243 değerlendirme</span>
                <span className="ml-2 rounded-md border border-[#1e3a5f] px-2 py-0.5">🔒 SSL Güvenli</span>
              </div>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4 border-t border-[#1e3a5f] pt-6 md:flex-row md:justify-between">
              <div className="flex flex-wrap justify-center gap-5 text-xs text-[#6b7280]">
                <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
                <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
                <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
                <Link href="/blog/iptv-nedir" className="transition-colors hover:text-white">IPTV Nedir?</Link>
                <Link href="/blog/iptv-fiyatlari-2026" className="transition-colors hover:text-white">IPTV Fiyatları</Link>
              </div>
              <p className="text-xs text-[#4b5563]">© {new Date().getFullYear()} GalyaStream. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
