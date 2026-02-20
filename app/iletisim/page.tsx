import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'İletişim - 7/24 Destek',
  description:
    'Galya IPTV müşteri hizmetleri ile 7/24 WhatsApp üzerinden iletişime geçin. Ücretsiz test ve teknik destek.',
  alternates: { canonical: 'https://galyaiptv.com.tr/iletisim' },
};

export default function ContactPage() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Galya IPTV
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <Link href="/#paketler" className="hover:text-white transition-colors">Paketler</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/iletisim" className="text-white font-medium">İletişim</Link>
          </div>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">İletişim</h1>
        <p className="text-gray-400 text-lg mb-12">
          7/24 WhatsApp destek hattımız üzerinden bize ulaşabilirsiniz.
        </p>

        <div className="grid md:grid-cols-2 gap-6 text-left mb-12">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-3">💬</div>
            <h2 className="font-bold text-lg mb-2">WhatsApp Destek</h2>
            <p className="text-gray-400 text-sm mb-4">
              En hızlı destek kanalımız. 7/24 yanıt veriyoruz.
            </p>
            <a
              href="https://wa.me/447445508352?text=Merhaba,%20destek%20almak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              WhatsApp'ta Yaz
            </a>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl mb-3">🆓</div>
            <h2 className="font-bold text-lg mb-2">Ücretsiz Test</h2>
            <p className="text-gray-400 text-sm mb-4">
              24 saatlik ücretsiz test hesabı talep edin.
            </p>
            <a
              href="https://wa.me/447445508352?text=Merhaba,%20ücretsiz%20IPTV%20test%20almak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Test Talep Et
            </a>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">Telefon</h2>
          <a
            href="tel:+447445508352"
            className="text-purple-400 hover:text-purple-300 text-2xl font-mono"
          >
            +44 7445 508352
          </a>
          <p className="text-gray-500 text-sm mt-2">Pazartesi - Pazar, 09:00 - 24:00</p>
        </div>
      </main>

      <footer className="border-t border-gray-800 py-8 px-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
      </footer>
    </>
  );
}
