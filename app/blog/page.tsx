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
    title: 'Smart TV\'ye IPTV Nasıl Kurulur? Adım Adım',
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
    title: 'MAG Box\'a IPTV Kurulumu',
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
