import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'IPTV Paketleri ve Fiyatları 2025',
  description:
    'GalyaStream paketleri: Aylık, 6 aylık, yıllık seçenekler. Uygun fiyat, kaliteli hizmet. Hemen IPTV satın al!',
  alternates: { canonical: 'https://www.galyastream.com/paketler' },
};

const packages = [
  {
    name: 'Başlangıç',
    duration: '1 Aylık',
    price: '800',
    connections: 1,
    features: ['10.000+ Kanal', 'Full HD Yayın', '7/24 Destek', 'Tüm Cihazlar'],
    popular: false,
  },
  {
    name: 'Standart',
    duration: '3 Aylık',
    price: '2.100',
    connections: 2,
    features: ['10.000+ Kanal', 'Full HD & 4K', '7/24 Destek', 'Tüm Cihazlar', 'VOD Arşivi'],
    popular: false,
  },
  {
    name: 'Popüler',
    duration: '6 Aylık',
    price: '3.500',
    connections: 2,
    features: ['10.000+ Kanal', '4K Ultra HD', '7/24 Destek', 'Tüm Cihazlar', 'VOD Arşivi', 'Ücretsiz Kurulum'],
    popular: true,
  },
  {
    name: 'Premium',
    duration: '12 Aylık',
    price: '6.000',
    connections: 3,
    features: ['10.000+ Kanal', '4K Ultra HD', '7/24 VIP Destek', 'Tüm Cihazlar', 'VOD Arşivi', 'Ücretsiz Kurulum', 'Öncelikli Destek'],
    popular: false,
  },
];

export default function PaketlerPage() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            GalyaStream
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <Link href="/paketler" className="text-white font-medium">Paketler</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">IPTV Paketleri ve Fiyatları</h1>
          <p className="text-gray-400 text-lg">
            İhtiyacınıza uygun paketi seçin. Tüm paketlerde ücretsiz test ve kurulum desteği.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative rounded-2xl p-6 border flex flex-col ${
                pkg.popular
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-gray-700 bg-gray-900/50'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  EN POPÜLER
                </div>
              )}
              <div className="text-gray-400 text-sm">{pkg.duration}</div>
              <h2 className="text-xl font-bold mt-1 mb-2">{pkg.name}</h2>
              <div className="text-4xl font-extrabold mb-1">₺{pkg.price}</div>
              <div className="text-gray-500 text-xs mb-2">{pkg.connections} bağlantı</div>
              <ul className="space-y-2 mb-6 flex-1">
                {pkg.features.map((f) => (
                  <li key={f} className="text-sm text-gray-300 flex items-center gap-2">
                    <span className="text-green-400 text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href={`https://wa.me/447445508352?text=Merhaba,%20${encodeURIComponent(pkg.name + ' ' + pkg.duration)}%20paketini%20almak%20istiyorum`}
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  pkg.popular
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'border border-gray-600 hover:border-purple-500 text-gray-300'
                }`}
              >
                Satın Al
              </a>
            </div>
          ))}
        </div>

        <div className="text-center bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-2">Karar veremediniz mi?</h2>
          <p className="text-gray-400 mb-6">24 saatlik ücretsiz test ile hizmetimizi deneyin.</p>
          <a
            href="https://wa.me/447445508352?text=Merhaba,%20ücretsiz%20IPTV%20test%20almak%20istiyorum"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-4 rounded-xl transition-colors"
          >
            💬 Ücretsiz Test Al
          </a>
        </div>
      </main>

      <footer className="border-t border-gray-800 py-8 px-4 text-center text-gray-500 text-sm mt-8">
        <p>© {new Date().getFullYear()} GalyaStream. Tüm hakları saklıdır.</p>
      </footer>
    </>
  );
}
