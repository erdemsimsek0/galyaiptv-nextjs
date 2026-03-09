import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'İletişim | Galya IPTV 7/24 WhatsApp Destek ve Ücretsiz Test',
  description:
    'Galya IPTV iletişim sayfası. 7/24 WhatsApp destek hattı, ücretsiz IPTV test yayını, hızlı kurulum ve teknik destek için hemen bizimle iletişime geçin.',
  keywords: [
    'Galya IPTV iletişim',
    'IPTV iletişim',
    'IPTV WhatsApp destek',
    'ücretsiz IPTV test',
    'IPTV müşteri hizmetleri',
    '7/24 IPTV destek',
    'Galya IPTV WhatsApp',
    'IPTV teknik destek',
  ],
  alternates: {
    canonical: 'https://galyaiptv.com.tr/iletisim',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'İletişim | Galya IPTV 7/24 WhatsApp Destek ve Ücretsiz Test',
    description:
      'Galya IPTV müşteri hizmetleri ile 7/24 WhatsApp üzerinden iletişime geçin. Ücretsiz test yayını ve teknik destek için hemen ulaşın.',
    url: 'https://galyaiptv.com.tr/iletisim',
    siteName: 'Galya IPTV',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'İletişim | Galya IPTV 7/24 WhatsApp Destek ve Ücretsiz Test',
    description:
      'Galya IPTV ile ücretsiz test yayını alın, 7/24 WhatsApp destek hattımıza ulaşın.',
  },
};

export default function ContactPage() {
  const phoneNumber = '+44 7441 921660';
  const phoneHref = 'tel:+447441921660';
  const whatsappBase = 'https://wa.me/447441921660';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-xl font-bold text-transparent"
            aria-label="Galya IPTV ana sayfa"
          >
            Galya IPTV
          </Link>

          <div className="flex items-center gap-6 text-sm text-gray-300">
            <Link href="/#paketler" className="transition-colors hover:text-white">
              Paketler
            </Link>
            <Link href="/blog" className="transition-colors hover:text-white">
              Blog
            </Link>
            <Link href="/iletisim" className="font-medium text-white" aria-current="page">
              İletişim
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <section>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            Galya IPTV İletişim ve Destek
          </h1>

          <p className="mb-12 text-lg leading-8 text-gray-400">
            Galya IPTV müşteri hizmetleri ile <strong className="text-white">7/24 WhatsApp destek</strong>{' '}
            üzerinden iletişime geçebilirsiniz. Ücretsiz IPTV test yayını, teknik destek,
            kurulum yardımı ve paket bilgileri için bize hemen ulaşın.
          </p>
        </section>

        <section className="mb-12 grid gap-6 text-left md:grid-cols-2">
          <article className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-3 text-3xl" aria-hidden="true">
              💬
            </div>
            <h2 className="mb-2 text-lg font-bold">WhatsApp Destek</h2>
            <p className="mb-4 text-sm leading-6 text-gray-400">
              En hızlı iletişim kanalımız üzerinden bize yazın. Teknik destek, paket bilgisi
              ve kurulum yardımı için 7/24 yanıt veriyoruz.
            </p>
            <a
              href={`${whatsappBase}?text=Merhaba,%20destek%20almak%20istiyorum`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-green-600 py-3 text-center font-semibold text-white transition-colors hover:bg-green-700"
              aria-label="WhatsApp üzerinden destek al"
            >
              WhatsApp&apos;ta Yaz
            </a>
          </article>

          <article className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-3 text-3xl" aria-hidden="true">
              🆓
            </div>
            <h2 className="mb-2 text-lg font-bold">Ücretsiz Test</h2>
            <p className="mb-4 text-sm leading-6 text-gray-400">
              Hizmeti satın almadan önce ücretsiz IPTV test yayını talep edebilirsiniz.
              Beğendiğiniz takdirde üyeliğiniz hemen aktif edilir.
            </p>
            <a
              href={`${whatsappBase}?text=Merhaba,%20ücretsiz%20IPTV%20test%20almak%20istiyorum`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl bg-purple-600 py-3 text-center font-semibold text-white transition-colors hover:bg-purple-700"
              aria-label="Ücretsiz IPTV test talep et"
            >
              Test Talep Et
            </a>
          </article>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-bold">Telefon ile İletişim</h2>
          <a
            href={phoneHref}
            className="font-mono text-2xl text-purple-400 transition-colors hover:text-purple-300"
            aria-label={`Telefon numarası ${phoneNumber}`}
          >
            {phoneNumber}
          </a>
          <p className="mt-2 text-sm text-gray-500">
            Pazartesi - Pazar, 09:00 - 24:00
          </p>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            IPTV paketleri, kurulum desteği, yayın sorunu ve test hesabı talepleriniz için
            WhatsApp veya telefon üzerinden bizimle iletişime geçebilirsiniz.
          </p>
        </section>
      </main>

      <footer className="border-t border-gray-800 px-4 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
      </footer>
    </>
  );
}
