import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'IPTV Blog - Rehberler, İpuçları ve Haberler | Galya IPTV',
  description:
    'IPTV hakkında her şey: kurulum rehberleri, en iyi player uygulamaları, cihaz uyumluluğu, kanal listeleri ve daha fazlası.',
  alternates: { canonical: 'https://galyaiptv.com.tr/blog' },
};

const posts = [
  // ─── Mevcut 6 yazı ──────────────────────────────────────────────────────────
  {
    slug: 'iptv-nedir',
    title: 'IPTV Nedir? Nasıl Çalışır? Kapsamlı Rehber',
    excerpt:
      'Internet üzerinden TV yayını almanın en iyi yolu olan IPTV teknolojisini detaylıca açıklıyoruz. Avantajları, dezavantajları ve nasıl kullanılacağı.',
    date: '2025-01-15',
    category: 'Rehber',
  },
  {
    slug: 'en-iyi-iptv-player',
    title: 'En İyi IPTV Player Uygulamaları 2025',
    excerpt:
      'TiviMate, IPTV Smarters, GSE Smart IPTV ve daha fazlası. Her platform için en iyi IPTV player uygulamalarını karşılaştırdık.',
    date: '2025-01-10',
    category: 'Uygulama',
  },
  {
    slug: 'smart-tv-iptv-kurulum',
    title: "Smart TV'ye IPTV Nasıl Kurulur? Adım Adım",
    excerpt:
      'Samsung, LG, Sony ve diğer Smart TV modellerine adım adım IPTV kurulum rehberi. Sorunsuz kurulum için tüm ipuçları.',
    date: '2025-01-05',
    category: 'Kurulum',
  },
  {
    slug: 'iptv-donma-sorunu-cozumu',
    title: 'IPTV Donma Sorunu Nasıl Çözülür?',
    excerpt:
      'IPTV izlerken donma, takılma yaşıyorsanız bu rehber tam size göre. Adım adım sorun giderme yöntemleri.',
    date: '2024-12-28',
    category: 'Sorun Giderme',
  },
  {
    slug: 'mag-box-iptv-kurulum',
    title: "MAG Box'a IPTV Kurulumu",
    excerpt:
      'MAG 250, MAG 322 ve diğer MAG Box modellerine IPTV nasıl kurulur? Detaylı rehber.',
    date: '2024-12-20',
    category: 'Kurulum',
  },
  {
    slug: 'iptv-vs-kablo-tv',
    title: 'IPTV mi Kablo TV mi? Hangisi Daha İyi?',
    excerpt:
      'IPTV ve geleneksel kablo TV arasındaki farklar, avantajlar ve dezavantajlar. Hangisini seçmelisiniz?',
    date: '2024-12-15',
    category: 'Karşılaştırma',
  },
  // ─── Yeni 20 yazı ───────────────────────────────────────────────────────────
  {
    slug: 'iptv-fiyatlari-2026',
    title: 'IPTV Fiyatları 2026: Güncel Paket Ücretleri ve Karşılaştırma Rehberi',
    excerpt:
      'Piyasada farklılık gösteren IPTV fiyatlarını analiz ediyor, fiyat/performans açısından en mantıklı seçimi nasıl yapacağınızı anlatıyoruz.',
    date: '2025-02-01',
    category: 'Rehber',
  },
  {
    slug: 'iptv-satin-almadan-once-10-soru',
    title: 'IPTV Satın Almadan Önce Bilmeniz Gereken 10 Kritik Soru',
    excerpt:
      'IPTV satın alma rehberi: doğru hizmeti seçerken internet hızı, cihaz uyumluluğu, sunucu kalitesi ve daha fazlasına dikkat etmeniz gerekenler.',
    date: '2025-02-03',
    category: 'Rehber',
  },
  {
    slug: 'iptv-ne-kadar-abonelik-maliyetleri',
    title: 'IPTV Ne Kadar? Aylık, 3 Aylık ve Yıllık Abonelik Maliyetleri',
    excerpt:
      'Aylık, 3 aylık, 6 aylık ve yıllık IPTV abonelik maliyetleri, fiyat karşılaştırması ve bütçe dostu seçenekler.',
    date: '2025-02-05',
    category: 'Rehber',
  },
  {
    slug: 'en-ucuz-iptv-paketleri',
    title: 'En Ucuz IPTV Paketleri: Kaliteden Ödün Vermeden Tasarruf Etme Rehberi',
    excerpt:
      'Bütçe dostu IPTV seçenekleri, tasarruf etmenin yolları ve ucuz IPTV alırken dikkat edilmesi gerekenler.',
    date: '2025-02-07',
    category: 'Rehber',
  },
  {
    slug: 'iptv-ucretleri-neden-degisir',
    title: 'IPTV Ücretleri Neden Değişir? Fiyatları Etkileyen 7 Faktör',
    excerpt:
      'Aynı hizmet gibi görünen IPTV paketleri arasındaki fiyat farklarının nedenlerini 7 temel faktörle açıklıyoruz.',
    date: '2025-02-09',
    category: 'Rehber',
  },
  {
    slug: 'iptv-nasil-kurulur-2026',
    title: 'IPTV Nasıl Kurulur? Adım Adım Kurulum Rehberi 2026',
    excerpt:
      'Smart TV, telefon, tablet ve bilgisayarda IPTV kurulumunu adım adım anlatan kapsamlı rehber.',
    date: '2025-02-11',
    category: 'Kurulum',
  },
  {
    slug: 'smart-tv-iptv-yukleme-tum-markalar',
    title: "Smart TV'ye IPTV Nasıl Yüklenir? Tüm Markalar İçin Rehber",
    excerpt:
      "Samsung, LG, Sony, Philips, Vestel, Arçelik ve diğer markalar için detaylı IPTV yükleme rehberi.",
    date: '2025-02-13',
    category: 'Kurulum',
  },
  {
    slug: 'telefonda-iptv-izleme',
    title: 'Telefonda IPTV İzleme: iOS ve Android İçin En İyi Uygulamalar',
    excerpt:
      'iPhone ve Android için en iyi IPTV uygulamaları, kurulum adımları ve mobil IPTV izleme ipuçları.',
    date: '2025-02-15',
    category: 'Uygulama',
  },
  {
    slug: 'iptv-kanal-listesi-guncelleme',
    title: 'IPTV Kanal Listesi Nasıl Güncellenir? M3U Link Ekleme Rehberi',
    excerpt:
      'M3U link ekleme, playlist güncelleme ve kanal listesi yönetimi hakkında detaylı bilgiler.',
    date: '2025-02-17',
    category: 'Rehber',
  },
  {
    slug: 'iptv-donma-buffering-cozumu-12-yontem',
    title: "IPTV'de Donma ve Buffering Sorunu Çözümü: 12 Etkili Yöntem",
    excerpt:
      'IPTV donma ve buffering sorunlarını gidermek için 12 etkili yöntem. Kesintisiz IPTV izleme için adım adım rehber.',
    date: '2025-02-19',
    category: 'Sorun Giderme',
  },
  {
    slug: 'iptv-vs-netflix-karsilastirma',
    title: 'IPTV vs Netflix: Hangisi Daha Avantajlı? Detaylı Karşılaştırma',
    excerpt:
      'Canlı TV, spor yayınları, güncel filmler ve fiyat açısından IPTV ile Netflix arasındaki farkları analiz ediyoruz.',
    date: '2025-02-21',
    category: 'Karşılaştırma',
  },
  {
    slug: 'en-iyi-iptv-uygulamalari-2026',
    title: "2026'nın En İyi IPTV Uygulamaları: TiviMate, IPTV Smarters ve Daha Fazlası",
    excerpt:
      'TiviMate, IPTV Smarters, GSE Smart IPTV ve diğer popüler uygulamaların karşılaştırması ve özellikleri.',
    date: '2025-02-23',
    category: 'Uygulama',
  },
  {
    slug: 'yasal-iptv-vs-kacak-iptv',
    title: 'Yasal IPTV vs Kaçak IPTV: Farklar, Riskler ve Bilmeniz Gerekenler',
    excerpt:
      'Yasal ve kaçak IPTV arasındaki farklar, hukuki riskler ve güvenilir IPTV seçimi hakkında detaylı bilgiler.',
    date: '2025-02-25',
    category: 'Rehber',
  },
  {
    slug: 'iptv-uydu-tv-karsilastirmasi',
    title: 'IPTV ve Uydu TV Karşılaştırması: Hangisi Daha İyi?',
    excerpt:
      'Fiyat, kalite, içerik ve kullanım kolaylığı açısından IPTV ve uydu TV arasındaki farkları inceliyoruz.',
    date: '2025-02-27',
    category: 'Karşılaştırma',
  },
  {
    slug: 'iptv-spor-paketleri-superlig',
    title: 'IPTV Spor Paketleri: Tüm Süper Lig Maçlarını Kaçırma Rehberi',
    excerpt:
      'IPTV spor paketlerinin içeriği, hangi liglerin ve spor kanallarının bulunduğu ve maçları 4K izlemenin yolları.',
    date: '2025-03-01',
    category: 'İçerik',
  },
  {
    slug: 'vip-dizi-film-arsivi-iptv',
    title: 'VIP Dizi ve Film Arşivi Olan IPTV Hizmetleri: İçerik Rehberi',
    excerpt:
      '50.000+ içerik, Türkçe dublaj, altyazı seçenekleri ve VOD arşivi sunan IPTV hizmetleri hakkında detaylı bilgiler.',
    date: '2025-03-03',
    category: 'İçerik',
  },
  {
    slug: '4k-iptv-izleme-ultra-hd',
    title: '4K IPTV İzleme: Ultra HD Kalite İçin Gerekenler',
    excerpt:
      'Ultra HD kalite için gerekli internet hızı, cihaz gereksinimleri ve 4K IPTV ayarları hakkında kapsamlı rehber.',
    date: '2025-03-05',
    category: 'Rehber',
  },
  {
    slug: 'iptv-kullanimi-yasal-mi-2026',
    title: "IPTV Kullanımı Yasal mı? Türkiye'de IPTV Hukuki Durumu 2026",
    excerpt:
      "Türkiye'de IPTV hukuki durumu, yasal sınırlar, kullanıcı sorumlulukları ve dikkat edilmesi gerekenler.",
    date: '2025-03-07',
    category: 'Rehber',
  },
  {
    slug: 'guvenilir-iptv-saglayicisi-secimi',
    title: 'Güvenilir IPTV Sağlayıcısı Nasıl Seçilir? 8 Önemli Kriter',
    excerpt:
      '8 önemli kriter, dolandırıcılıktan korunma yöntemleri ve güvenli IPTV satın alma rehberi.',
    date: '2025-03-09',
    category: 'Rehber',
  },
  {
    slug: 'iptv-guvenlik-vpn-ip-koruma',
    title: "IPTV'de Güvenlik: VPN Kullanımı ve IP Koruma Rehberi",
    excerpt:
      'VPN kullanımı, IP koruma, güvenli IPTV izleme ve veri güvenliği hakkında detaylı bilgiler.',
    date: '2025-03-11',
    category: 'Rehber',
  },
  // ─── Yeni Makale ────────────────────────────────────────────────────────────
  {
    slug: 'iptv-satin-al',
    title: 'IPTV Satın Al: Donmasız 4K Premium IPTV Aboneliği – Galya IPTV',
    excerpt:
      'IPTV satın almadan önce bilmeniz gereken her şey: paket fiyatları, donmasız 4K yayın altyapısı, Xtream & M3U kurulumu ve ücretsiz test yayını rehberi.',
    date: '2025-03-13',
    category: 'Rehber',
  },
];

const categoryColors: Record<string, string> = {
  Rehber:          'bg-purple-900/50 text-purple-300',
  Kurulum:         'bg-blue-900/50 text-blue-300',
  Uygulama:        'bg-pink-900/50 text-pink-300',
  'Sorun Giderme': 'bg-red-900/50 text-red-300',
  Karşılaştırma:   'bg-yellow-900/50 text-yellow-300',
  İçerik:          'bg-green-900/50 text-green-300',
};

const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Galya IPTV Blog',
  url: 'https://galyaiptv.com.tr/blog',
  description: 'IPTV rehberleri, ipuçları ve haberleri',
  blogPost: posts.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    url: `https://galyaiptv.com.tr/blog/${p.slug}`,
    datePublished: p.date,
  })),
};

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            Galya IPTV
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <Link href="/#paketler" className="hover:text-white transition-colors">
              Paketler
            </Link>
            <Link href="/blog" className="text-white font-medium">
              Blog
            </Link>
            <Link href="/iletisim" className="hover:text-white transition-colors">
              İletişim
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">

        {/* ── Hero ── */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-800/50 text-purple-300 text-xs px-3 py-1.5 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            {posts.length} makale
          </div>
          <h1 className="text-4xl font-bold mb-4 text-white">IPTV Blog</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            IPTV kurulum rehberleri, en iyi uygulamalar, fiyat karşılaştırmaları ve güncel haberler.
          </p>
        </div>

        {/* ── Öne Çıkan Makale (en yeni) ── */}
        {(() => {
          const featured = posts[posts.length - 1];
          return (
            <Link
              href={`/blog/${featured.slug}`}
              className="group block mb-10 bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-800/40 hover:border-purple-600/70 rounded-2xl p-6 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  ✨ Yeni Makale
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    categoryColors[featured.category] ?? 'bg-gray-800 text-gray-300'
                  }`}
                >
                  {featured.category}
                </span>
                <span className="text-gray-600 text-xs ml-auto">{featured.date}</span>
              </div>
              <h2 className="font-bold text-xl mb-2 text-white group-hover:text-purple-300 transition-colors leading-snug">
                {featured.title}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">{featured.excerpt}</p>
              <span className="text-purple-400 text-sm font-medium">Devamını Oku →</span>
            </Link>
          );
        })()}

        {/* ── Makale Izgarası ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts
            .slice(0, posts.length - 1) // öne çıkan hariç
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((post) => (
              <article key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="flex flex-col bg-gray-900 border border-gray-800 hover:border-purple-700/60 rounded-xl p-5 h-full transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        categoryColors[post.category] ?? 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {post.category}
                    </span>
                    <span className="text-gray-600 text-xs ml-auto">{post.date}</span>
                  </div>
                  <h2 className="font-bold text-base mb-2 group-hover:text-purple-400 transition-colors leading-snug flex-1">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 text-purple-400 text-sm font-medium">Devamını Oku →</div>
                </Link>
              </article>
            ))}
        </div>

        {/* ── CTA Bandı ── */}
        <div className="mt-16 bg-gradient-to-r from-purple-900/30 to-pink-900/20 border border-purple-800/40 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Donmasız 4K IPTV'yi Ücretsiz Deneyin
          </h3>
          <p className="text-gray-400 text-sm mb-5 max-w-md mx-auto">
            Paketleri inceleyin, 24 saatlik ücretsiz test isteyin ve satın almadan önce kaliteyi kendiniz görün.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/#paketler"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-200"
            >
              Paketleri İncele
            </Link>
            <a
              href="https://wa.me/447441921660?text=Merhaba%2C%20%C3%BCcretsiz%20test%20yay%C4%B1n%C4%B1%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-200 border border-gray-700"
            >
              💬 Ücretsiz Test Al
            </a>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800 py-8 px-4 text-center text-gray-500 text-sm mt-8">
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
      </footer>
    </>
  );
}
