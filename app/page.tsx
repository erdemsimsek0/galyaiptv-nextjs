import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Galya IPTV - IPTV Satın Al | Premium IPTV Hizmeti 2025',
  description:
    'Galya IPTV ile en kaliteli IPTV deneyimi. 10.000+ kanal, 4K yayın, 7/24 destek, ücretsiz test. Türkiye\'nin en iyi IPTV sağlayıcısı.',
  alternates: { canonical: 'https://galyaiptv.com' },
};

const packages = [
  {
    name: 'Başlangıç Paketi',
    duration: '1 Aylık',
    price: '800',
    features: ['10.000+ Kanal', 'Full HD Yayın', '7/24 Destek', '1 Bağlantı'],
    popular: false,
  },
  {
    name: 'Popüler Paket',
    duration: '6 Aylık',
    price: '3.500',
    features: ['10.000+ Kanal', '4K Yayın', '7/24 Destek', '2 Bağlantı', 'Ücretsiz Kurulum'],
    popular: true,
  },
  {
    name: 'Premium Paket',
    duration: '12 Aylık',
    price: '6.000',
    features: ['10.000+ Kanal', '4K Ultra HD', '7/24 Destek', '3 Bağlantı', 'Ücretsiz Kurulum', 'VIP Destek'],
    popular: false,
  },
];

const faqs = [
  {
    q: 'IPTV nedir?',
    a: 'IPTV (Internet Protocol Television), internet üzerinden televizyon yayını almanızı sağlayan bir teknolojidir. Galya IPTV ile dünyanın dört bir yanından 10.000+ kanala erişebilirsiniz.',
  },
  {
    q: 'IPTV satın almak güvenli mi?',
    a: 'Evet, Galya IPTV olarak müşteri memnuniyetini ön planda tutuyoruz. 7/24 teknik destek, kesintisiz yayın ve %99.9 uptime garantisi sunuyoruz.',
  },
  {
    q: 'IPTV test alabilir miyim?',
    a: 'Evet, ücretsiz IPTV test hizmetimizden yararlanabilirsiniz. WhatsApp üzerinden bize ulaşarak 24 saatlik test hesabı talep edebilirsiniz.',
  },
  {
    q: 'Hangi cihazlarda çalışır?',
    a: 'Android TV, Smart TV (Samsung, LG, Sony), iOS, Android telefon/tablet, MAG Box, Enigma2 ve daha birçok cihazda sorunsuz çalışır.',
  },
  {
    q: 'Kurulum desteği var mı?',
    a: 'Evet, 7/24 WhatsApp destek hattımız üzerinden ücretsiz kurulum yardımı alabilirsiniz. Uzman ekibimiz kurulum sürecinde yanınızda olacak.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Galya IPTV Abonelik',
  image: 'https://galyaiptv.com/iptv-product.jpg',
  description: 'Premium IPTV hizmeti ile 10.000+ kanala erişim. 4K, Full HD yayın kalitesi.',
  brand: { '@type': 'Brand', name: 'Galya IPTV' },
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '800',
    highPrice: '6000',
    priceCurrency: 'TRY',
    availability: 'https://schema.org/InStock',
    offerCount: '3',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    bestRating: '5',
    reviewCount: '2847',
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold gradient-text">
            Galya IPTV
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <Link href="/#paketler" className="hover:text-white transition-colors">Paketler</Link>
            <Link href="/#ozellikler" className="hover:text-white transition-colors">Özellikler</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link>
            <a
              href="https://wa.me/447445508352?text=Merhaba,%20IPTV%20test%20almak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Ücretsiz Test
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/50 to-gray-950 pointer-events-none" />
          <div className="relative max-w-4xl mx-auto">
            <div className="inline-block bg-purple-900/50 border border-purple-700 text-purple-300 text-sm px-4 py-1 rounded-full mb-6">
              ⭐ 2847+ Memnun Müşteri · %99.9 Uptime Garantisi
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Türkiye'nin En İyi{' '}
              <span className="gradient-text">IPTV Hizmeti</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              10.000+ kanal, 4K Ultra HD yayın kalitesi, donmayan altyapı ve 7/24 teknik destek.
              IPTV satın al, anında başla!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/447445508352?text=Merhaba,%20IPTV%20test%20almak%20istiyorum"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                🆓 Ücretsiz Test Al
              </a>
              <Link
                href="/#paketler"
                className="border border-purple-500 text-purple-300 hover:bg-purple-900/30 font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                Paketleri İncele
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y border-gray-800 bg-gray-900/50">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10.000+', label: 'Canlı Kanal' },
              { value: '4K', label: 'Ultra HD Yayın' },
              { value: '7/24', label: 'Teknik Destek' },
              { value: '%99.9', label: 'Uptime Garantisi' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Packages */}
        <section id="paketler" className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              IPTV Paketleri
            </h2>
            <p className="text-gray-400 text-center mb-12">
              İhtiyacınıza göre en uygun paketi seçin. Tüm paketlerde ücretsiz kurulum desteği.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`relative rounded-2xl p-6 border ${
                    pkg.popular
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-gray-700 bg-gray-900/50'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      EN POPÜLER
                    </div>
                  )}
                  <div className="text-gray-400 text-sm mb-1">{pkg.duration}</div>
                  <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-extrabold mb-1">
                    ₺{pkg.price}
                  </div>
                  <div className="text-gray-500 text-sm mb-6">tek seferlik ödeme</div>
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-green-400">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`https://wa.me/447445508352?text=Merhaba,%20${encodeURIComponent(pkg.name)}%20almak%20istiyorum`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
                      pkg.popular
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'border border-gray-600 hover:border-purple-500 text-gray-300 hover:text-white'
                    }`}
                  >
                    Şimdi Satın Al
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="ozellikler" className="py-20 px-4 bg-gray-900/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Neden Galya IPTV?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '📺', title: '10.000+ Kanal', desc: 'Türk, yabancı, spor, film, dizi kanalları. Her kategoride en geniş içerik.' },
                { icon: '🎯', title: '4K Ultra HD Yayın', desc: 'Kristal netliğinde görüntü kalitesi. 4K, Full HD ve HD seçenekleri.' },
                { icon: '⚡', title: 'Donmayan Altyapı', desc: 'Güçlü sunucu altyapısı ile kesintisiz yayın. Hiçbir donma, takılma yok.' },
                { icon: '🛡️', title: '7/24 Teknik Destek', desc: 'WhatsApp üzerinden her saat ulaşabileceğiniz uzman destek ekibi.' },
                { icon: '📱', title: 'Tüm Cihazlarda', desc: 'Smart TV, telefon, tablet, PC, MAG Box ve daha fazla cihazda çalışır.' },
                { icon: '🆓', title: 'Ücretsiz Test', desc: '24 saatlik ücretsiz test ile satın almadan önce hizmetimizi deneyin.' },
              ].map((f) => (
                <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="sss" className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Sıkça Sorulan Sorular
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 group"
                >
                  <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                    {faq.q}
                    <span className="text-purple-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Preview */}
        <section className="py-20 px-4 bg-gray-900/30">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Son Blog Yazıları</h2>
              <Link href="/blog" className="text-purple-400 hover:text-purple-300 text-sm">
                Tümünü Gör →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  slug: 'iptv-nedir',
                  title: 'IPTV Nedir? Nasıl Çalışır?',
                  excerpt: 'Internet üzerinden TV yayını almanın en iyi yolu olan IPTV teknolojisini detaylıca açıklıyoruz.',
                  date: '2025-01-15',
                },
                {
                  slug: 'en-iyi-iptv-player',
                  title: 'En İyi IPTV Player Uygulamaları 2025',
                  excerpt: 'TiviMate, IPTV Smarters, GSE Smart IPTV... Hangisi sizin için en iyi seçenek?',
                  date: '2025-01-10',
                },
                {
                  slug: 'smart-tv-iptv-kurulum',
                  title: 'Smart TV\'ye IPTV Nasıl Kurulur?',
                  excerpt: 'Samsung, LG ve diğer Smart TV modellerine adım adım IPTV kurulum rehberi.',
                  date: '2025-01-05',
                },
              ].map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="bg-gray-900 border border-gray-800 hover:border-purple-700 rounded-xl p-5 transition-colors group"
                >
                  <div className="text-xs text-gray-500 mb-2">{post.date}</div>
                  <h3 className="font-bold mb-2 group-hover:text-purple-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Hemen Başlayın!</h2>
            <p className="text-gray-400 mb-8">
              Ücretsiz test ile Galya IPTV'yi deneyin. Memnun kalırsanız en uygun paketi seçin.
            </p>
            <a
              href="https://wa.me/447445508352?text=Merhaba,%20IPTV%20test%20almak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors"
            >
              💬 WhatsApp ile Bağlan
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-10 px-4 text-center text-gray-500 text-sm">
        <p className="mb-2 font-semibold text-gray-300">Galya IPTV</p>
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
        <div className="flex justify-center gap-6 mt-4">
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <Link href="/paketler" className="hover:text-white transition-colors">Paketler</Link>
          <Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link>
        </div>
      </footer>
    </>
  );
}
