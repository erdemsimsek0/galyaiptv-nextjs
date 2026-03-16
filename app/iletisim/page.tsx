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
          dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
          opens: '00:00',
          closes: '23:59',
        },
      },
    ],
  },
};

export default function ContactPage() {
  const whatsappSupport = `${WHATSAPP_BASE}?text=Merhaba%2C%20destek%20almak%20istiyorum`;
  const whatsappTest   = `${WHATSAPP_BASE}?text=Merhaba%2C%20%C3%BCcretsiz%20IPTV%20testi%20almak%20istiyorum`;
  const whatsappBuy    = `${WHATSAPP_BASE}?text=Merhaba%2C%20IPTV%20sat%C4%B1n%20almak%20istiyorum`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#18181f]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#f1f0f5]">
            Galya<span className="text-[#7c6fcd]">Stream</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-[#9b98b0]">
            <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
            <Link href="/blog"      className="transition-colors hover:text-white">Blog</Link>
            <Link href="/iletisim"  className="font-medium text-white" aria-current="page">İletişim</Link>
            <Link href="/araclar"   className="transition-colors hover:text-white">Araçlar</Link>
          </div>
        </nav>
      </header>

      <main className="bg-[#18181f] text-[#f1f0f5]">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-20 pt-20 text-center">
          {/* Arka plan parıltısı */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-[#7c6fcd]/8 blur-3xl" />

          <div className="relative mx-auto max-w-3xl">
            {/* Rozet */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#22222c] px-4 py-1.5 text-xs text-[#9b98b0]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              7/24 Aktif Destek
            </div>

            <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              İletişim
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-[#9b98b0] md:text-lg">
              Teknik destek, ücretsiz test veya paket bilgisi için{' '}
              <strong className="text-white">7/24 WhatsApp</strong> hattımız üzerinden
              bize ulaşın. Ortalama yanıt süresi <strong className="text-[#7c6fcd]">2 dakikadır</strong>.
            </p>

            {/* Hız metrikleri */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#9b98b0]">
              {[
                { icon: '⚡', text: 'Ortalama yanıt: 2 dk' },
                { icon: '🌐', text: '7/24 Türkçe destek' },
                { icon: '🆓', text: 'Ücretsiz test mevcut' },
              ].map((item) => (
                <span key={item.text} className="flex items-center gap-1.5">
                  <span>{item.icon}</span> {item.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── İletişim Kartları ────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.08] px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-5 md:grid-cols-3">

              {/* WhatsApp Destek */}
              <article className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#141418] p-6 transition-all hover:border-[#25d366]/30 hover:bg-[#22222c]">
                <div className="mb-4 text-3xl">💬</div>
                <h2 className="mb-2 text-lg font-bold text-white">WhatsApp Destek</h2>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-[#9b98b0]">
                  En hızlı iletişim kanalımız. Teknik destek, paket bilgisi ve kurulum yardımı
                  için 7/24 yanıt veriyoruz.
                </p>
                <a
                  href={whatsappSupport}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5d]"
                  aria-label="WhatsApp üzerinden destek al"
                >
                  💬 WhatsApp&apos;ta Yaz
                </a>
              </article>

              {/* Ücretsiz Test */}
              <article className="flex flex-col rounded-2xl border border-[#7c6fcd]/40 bg-gradient-to-b from-[#7c6fcd]/10 to-[#7c6fcd]/[0.03] p-6 transition-all hover:border-[#7c6fcd]/60 hover:shadow-xl hover:shadow-[#7c6fcd]/10">
                <div className="mb-4 text-3xl">🆓</div>
                <h2 className="mb-2 text-lg font-bold text-white">Ücretsiz Test</h2>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-[#9b98b0]">
                  Satın almadan önce 12 saatlik ücretsiz IPTV test yayını talep edin.
                  Kredi kartı gerekmez.
                </p>
                <a
                  href={whatsappTest}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl bg-[#7c6fcd] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#6358b8]"
                  aria-label="Ücretsiz IPTV test talep et"
                >
                  ⚡ Test Talep Et
                </a>
              </article>

              {/* Satın Al */}
              <article className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#141418] p-6 transition-all hover:border-white/20 hover:bg-[#22222c]">
                <div className="mb-4 text-3xl">🛒</div>
                <h2 className="mb-2 text-lg font-bold text-white">Paket Satın Al</h2>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-[#9b98b0]">
                  ₺500&apos;den başlayan fiyatlarla IPTV aboneliği satın alın. Anında
                  kurulum ve 7/24 destek dahil.
                </p>
                <a
                  href={whatsappBuy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-[#22222c] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] hover:border-white/30"
                >
                  Satın Al →
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* ── Yanıt Süresi Bilgi Bandı ──────────────────────────────────────── */}
        <section className="border-y border-white/[0.08] bg-white/[0.01] px-6 py-5">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { icon: '🕐', label: 'Destek Saatleri', value: '7/24, her gün' },
              { icon: '⚡', label: 'Ort. Yanıt Süresi', value: '~2 dakika' },
              { icon: '📦', label: 'Test Teslimatı', value: 'Anında' },
              { icon: '🌐', label: 'Dil', value: 'Türkçe' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <div className="text-xs text-[#9b98b0]">{item.label}</div>
                  <div className="font-semibold text-white">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SSS ──────────────────────────────────────────────────────────── */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
              Sık Sorulan Sorular
            </h2>
            <div className="space-y-2">
              {[
                {
                  q: 'Test yayını ücretsiz mi?',
                  a: 'Evet, 12 saatlik test yayını tamamen ücretsizdir. Kredi kartı bilgisi gerekmez.',
                },
                {
                  q: 'WhatsApp dışında iletişim kanalınız var mı?',
                  a: 'Şu an için birincil destek kanalımız WhatsApp\'tır. Telefon görüşmesi için de numaramızı kullanabilirsiniz.',
                },
                {
                  q: 'Teknik sorunum var, ne yapmalıyım?',
                  a: 'WhatsApp hattımıza yazın. Kurulum, donma ve bağlantı sorunları için adım adım destek veriyoruz.',
                },
                {
                  q: 'Satın alma sonrası ne kadar sürede kurulum yapılır?',
                  a: 'Ödeme onaylandıktan sonra bilgileriniz anında e-posta ile iletilir. WhatsApp desteğiyle 10 dakika içinde kurulumu tamamlayabilirsiniz.',
                },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-white/[0.08] bg-[#22222c] px-5 py-4 transition-colors hover:border-white/[0.12]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-zinc-200">
                    {faq.q}
                    <span className="shrink-0 text-[10px] text-[#6b6880] transition-transform group-open:rotate-180">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[#9b98b0]">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── İç Bağlantılar / CTA ──────────────────────────────────────────── */}
        <section className="border-t border-white/[0.08] px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-3 text-xl font-bold">Daha Fazla Bilgi</h2>
            <p className="mb-6 text-sm text-[#9b98b0]">
              Paketlerimizi inceleyebilir veya blog yazılarımızdan IPTV hakkında daha fazla bilgi edinebilirsiniz.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/#paketler"
                className="rounded-xl bg-[#7c6fcd] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7c6fcd]/20 transition-all hover:bg-[#6358b8]"
              >
                Paketleri İncele
              </Link>
              <Link
                href="/blog"
                className="rounded-xl border border-white/[0.08] bg-[#22222c] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.06]"
              >
                Blog'u Oku
              </Link>
              <Link
                href="/blog/iptv-nedir"
                className="rounded-xl border border-white/[0.08] bg-[#22222c] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.06]"
              >
                IPTV Nedir?
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#141418] px-6 py-10 text-center text-sm text-[#6b6880]">
        <p className="mb-1 font-semibold text-[#9b98b0]">GalyaStream</p>
        <p>© {new Date().getFullYear()} GalyaStream. Tüm hakları saklıdır.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs">
          <Link href="/#paketler" className="transition-colors hover:text-[#f1f0f5]">IPTV Fiyatları</Link>
          <Link href="/blog"      className="transition-colors hover:text-[#f1f0f5]">Blog</Link>
          <Link href="/iletisim"  className="transition-colors hover:text-[#f1f0f5]">İletişim</Link>
        </div>
      </footer>
    </>
  );
}
