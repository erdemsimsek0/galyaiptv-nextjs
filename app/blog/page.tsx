import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'IPTV Blog - Rehberler, İpuçları ve Haberler',
  description:
    'IPTV hakkında her şey: kurulum rehberleri, en iyi player uygulamaları, cihaz uyumluluğu, kanal listeleri ve daha fazlası.',
  alternates: { canonical: 'https://galyaiptv.com.tr/blog' },
};

const posts = [
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
  {
    slug: 'iptv-nedir-geleneksel-tv-karsilastirma',
    title: "IPTV Nedir? Geleneksel TV'ye Karşı Avantajları Nelerdir?",
    excerpt:
      "IPTV teknolojisinin ne olduğunu temelden anlatıyor, geleneksel TV yayıncılığı ile arasındaki farkları ve IPTV'nin sunduğu esneklik, içerik zenginliği gibi avantajları vurguluyoruz.",
    date: '2025-01-20',
    category: 'Rehber',
  },
  {
    slug: 'iptv-satin-almadan-once-bilinmesi-gerekenler-2026',
    title: '2026 Yılında IPTV Satın Almadan Önce Bilmeniz Gerekenler',
    excerpt:
      'IPTV satın alma rehberi: doğru hizmeti seçerken internet hızı, cihaz uyumluluğu, sunucu kalitesi ve daha fazlasına dikkat etmeniz gerekenler.',
    date: '2025-01-22',
    category: 'Rehber',
  },
  {
    slug: 'iptv-fiyatlari-kaliteli-ucuz-hizmet',
    title: 'IPTV Fiyatları: Kaliteli ve Ucuz IPTV Hizmeti Nasıl Bulunur?',
    excerpt:
      'Piyasada farklılık gösteren IPTV fiyatlarını analiz ediyor, fiyat/performans açısından en mantıklı seçimi nasıl yapacağınızı ve tuzaklardan nasıl kaçınacağınızı anlatıyoruz.',
    date: '2025-01-25',
    category: 'Rehber',
  },
  {
    slug: 'donmayan-iptv-icin-5-ipucu',
    title: 'Donmayan IPTV Deneyimi İçin Altın Değerinde 5 İpucu',
    excerpt:
      'IPTV kullanıcılarının en büyük şikayeti olan donma sorununa odaklanıyoruz. İnternet bağlantısından cihaz optimizasyonuna kadar kesintisiz yayın için adım adım rehber.',
    date: '2025-01-28',
    category: 'Sorun Giderme',
  },
  {
    slug: 'smart-tv-iptv-kurulumu-resimli',
    title: "Smart TV'de IPTV Kurulumu: Adım Adım Resimli Anlatım",
    excerpt:
      "Samsung, LG gibi popüler Smart TV markalarında IPTV'nin nasıl kurulacağını SSIPTV ve Smart IPTV uygulamaları üzerinden görsellerle destekleyerek anlatıyoruz.",
    date: '2025-02-01',
    category: 'Kurulum',
  },
  {
    slug: 'en-iyi-iptv-uygulamalari-2026',
    title: "En İyi IPTV Uygulamaları: 2026'nın Gözde 7 Uygulaması",
    excerpt:
      'Android, iOS, Windows ve Smart TV için en popüler ve stabil IPTV uygulamalarını (IPTV Smarters, TiviMate, GSE Smart IPTV vb.) karşılaştırmalı olarak inceliyoruz.',
    date: '2025-02-05',
    category: 'Uygulama',
  },
  {
    slug: 'iptv-test-yayini-neden-onemli',
    title: 'IPTV Test Yayını: Satın Almadan Önce Neden Denemelisiniz?',
    excerpt:
      'Ücretsiz test yayınının önemi: kullanıcıların test yayını talep ederek yayın kalitesini, kanal çeşitliliğini ve sunucu hızını nasıl kontrol edebileceklerini anlatıyoruz.',
    date: '2025-02-08',
    category: 'Rehber',
  },
  {
    slug: 'iptv-spor-paketleri',
    title: 'IPTV Spor Paketleri: Derbi Maçlarını ve Ligleri Kaçırmayın!',
    excerpt:
      'Spor tutkunlarına özel: IPTV spor paketlerinin içeriğini, hangi liglerin ve spor kanallarının bulunduğunu ve maçları 4K kalitesinde izlemenin keyfini anlatıyoruz.',
    date: '2025-02-12',
    category: 'İçerik',
  },
  {
    slug: 'guvenilir-iptv-satici-nasil-anlasilir',
    title: 'Güvenilir IPTV Satıcısı Nasıl Anlaşılır? Dolandırılmayın!',
    excerpt:
      'Piyasada artan sahte satıcılara karşı uyarıyoruz. Güvenilir bir IPTV hizmetinde olması gereken özellikler: 7/24 destek, iade garantisi, kurumsal fatura ve daha fazlası.',
    date: '2025-02-15',
    category: 'Rehber',
  },
  {
    slug: 'iptv-kanal-listesi',
    title: 'IPTV Kanal Listesi: Hangi Kanallar Var, Neler İzleyebilirsiniz?',
    excerpt:
      'Ulusal kanallardan sinema, belgesel, çocuk ve spor kanallarına kadar geniş bir yelpazede sunulan IPTV kanal listesini tanıtıyor, popüler kanallara vurgu yapıyoruz.',
    date: '2025-02-18',
    category: 'İçerik',
  },
  {
    slug: 'iptv-yasallik-turkiye',
    title: "IPTV ve Yasallık: Türkiye'de IPTV Kullanmak Yasal mı?",
    excerpt:
      "Kullanıcıların en çok merak ettiği IPTV'nin yasal boyutunu ele alıyor, telif hakları ve yasal kullanım hakkında bilgilendirici bir rehber sunuyoruz.",
    date: '2025-02-20',
    category: 'Rehber',
  },
  {
    slug: 'android-box-iptv',
    title: 'Android Box ile IPTV Keyfi: Cihazınızı Medya Merkezine Dönüştürün',
    excerpt:
      'Android TV Box cihazlarında IPTV kurulumunu ve kullanımını anlatıyor, bu cihazların avantajlarını ve en iyi Android Box modellerini listeliyoruz.',
    date: '2025-02-22',
    category: 'Kurulum',
  },
  {
    slug: 'iptv-vod-film-dizi',
    title: 'VOD (Video on Demand) Nedir? IPTV ile Binlerce Film ve Diziye Erişin',
    excerpt:
      "IPTV'nin sadece canlı yayın değil, aynı zamanda dev bir film ve dizi arşivi (VOD) sunduğunu anlatıyor, popüler içeriklere nasıl ulaşabileceğinizi gösteriyoruz.",
    date: '2025-02-25',
    category: 'İçerik',
  },
  {
    slug: 'iptv-alirken-yapilan-hatalar',
    title: 'IPTV Alırken En Sık Yapılan 5 Hata',
    excerpt:
      'Kullanıcıların IPTV satın alırken düştükleri yaygın hataları (sadece fiyata odaklanmak, test yayını almamak vb.) anlatıyor ve doğru karar vermeniz için yol gösteriyoruz.',
    date: '2025-02-28',
    category: 'Rehber',
  },
  {
    slug: 'm3u-linki-nedir-nasil-kullanilir',
    title: 'M3U Linki Nedir ve IPTV İçin Nasıl Kullanılır?',
    excerpt:
      'IPTV kurulumunun temel taşı olan M3U linkinin ne olduğunu, nasıl alındığını ve farklı cihazlardaki uygulamalara nasıl yüklendiğini sade bir dille anlatıyoruz.',
    date: '2025-03-02',
    category: 'Rehber',
  },
  {
    slug: 'aileler-icin-iptv-cocuk-kilidi',
    title: 'Aileler İçin IPTV: Çocuk Kilidi ve Güvenli İçerik Yönetimi',
    excerpt:
      'Çocuklu aileler için IPTV güvenli kullanım rehberi: yetişkin kanallarını şifreleme, çocuk kanallarını favorilere ekleme ve güvenli içerik yönetimi.',
    date: '2025-03-05',
    category: 'Rehber',
  },
  {
    slug: 'yurt-disinda-turk-kanallari-iptv',
    title: "Yurt Dışında Yaşayanlar İçin IPTV: Türk Kanallarını Dünyanın Her Yerinden İzleyin",
    excerpt:
      "Gurbetçilere özel: yurt dışından Türk kanallarını kesintisiz izlemenin en kolay yolu IPTV. Almanya, Fransa ve diğer ülkeler için çözümler sunuyoruz.",
    date: '2025-03-08',
    category: 'Rehber',
  },
  {
    slug: 'iptv-vs-netflix',
    title: 'IPTV vs. Netflix: Hangisi Sizin İçin Daha Uygun?',
    excerpt:
      'İki popüler yayın hizmetini karşılaştırıyoruz: canlı TV, spor yayınları, güncel filmler ve fiyat açısından hangisinin daha avantajlı olduğunu analiz ediyoruz.',
    date: '2025-03-10',
    category: 'Karşılaştırma',
  },
  {
    slug: 'iptv-kanal-listesi-olusturma',
    title: 'Kendi IPTV Kanal Listenizi Oluşturun: Favori Kanallarınızı Düzenleme Rehberi',
    excerpt:
      'Binlerce kanal arasında kaybolmayın! Kendi favori listelerinizi nasıl oluşturabileceğinizi, kanalları nasıl sıralayabileceğinizi ve gruplandırabileceğinizi anlatıyoruz.',
    date: '2025-03-12',
    category: 'Rehber',
  },
  {
    slug: 'iptv-teknolojisi-gelecek-trendler',
    title: "Geleceğin Televizyonu: IPTV Teknolojisindeki Son Gelişmeler ve Trendler",
    excerpt:
      "IPTV'nin geleceğine ışık tutuyoruz: 8K yayınlar, yapay zeka destekli öneri motorları, bulut tabanlı kayıt (Cloud PVR) gibi yeni teknolojiler ve trendler.",
    date: '2025-03-15',
    category: 'Teknoloji',
  },
];

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

      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Galya IPTV
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <Link href="/#paketler" className="hover:text-white transition-colors">Paketler</Link>
            <Link href="/blog" className="text-white font-medium">Blog</Link>
            <Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link>
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">IPTV Blog</h1>
          <p className="text-gray-400 text-lg">
            IPTV kurulum rehberleri, en iyi uygulamalar, ipuçları ve haberler.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block bg-gray-900 border border-gray-800 hover:border-purple-700 rounded-xl p-5 h-full transition-colors group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded">
                    {post.category}
                  </span>
                  <span className="text-gray-600 text-xs">{post.date}</span>
                </div>
                <h2 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">{post.excerpt}</p>
                <div className="mt-4 text-purple-400 text-sm">Devamını Oku →</div>
              </Link>
            </article>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-800 py-8 px-4 text-center text-gray-500 text-sm mt-8">
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
      </footer>
    </>
  );
}
