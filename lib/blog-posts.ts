import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'IPTV Blog – Rehberler, İpuçları ve Haberler | Galya IPTV',
  description:
    'IPTV kurulum rehberleri, en iyi player uygulamaları, fiyat karşılaştırmaları, donma çözümleri ve güncel IPTV haberleri. Galya IPTV Blog.',
  alternates: { canonical: 'https://galyaiptv.com.tr/blog' },
  openGraph: {
    title: 'IPTV Blog – Rehberler, İpuçları ve Haberler | Galya IPTV',
    description: 'IPTV kurulum rehberleri, en iyi uygulamalar, fiyat karşılaştırmaları ve haberler.',
    url: 'https://galyaiptv.com.tr/blog',
    siteName: 'Galya IPTV',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPTV Blog | Galya IPTV',
    description: 'IPTV rehberleri, kurulum ipuçları ve en iyi IPTV paketleri.',
  },
};

const posts = [
  // ─── Mevcut 6 yazı ───────────────────────────────────────────────────────────
  {
    slug: 'iptv-nedir',
    title: 'IPTV Nedir? Nasıl Çalışır? Kapsamlı Rehber',
    excerpt:
      'IPTV teknolojisini detaylıca açıklıyoruz. Avantajları, dezavantajları ve nasıl kullanılacağı.',
    date: '2026-01-15',
    category: 'Rehber',
  },
  {
    slug: 'en-iyi-iptv-player',
    title: 'En İyi IPTV Player Uygulamaları 2026',
    excerpt:
      'TiviMate, IPTV Smarters, GSE Smart IPTV ve daha fazlası. Her platform için en iyi seçenekler.',
    date: '2026-01-10',
    category: 'Uygulama',
  },
  {
    slug: 'smart-tv-iptv-kurulum',
    title: "Smart TV'ye IPTV Nasıl Kurulur? Adım Adım",
    excerpt:
      'Samsung, LG, Sony ve diğer Smart TV modellerine adım adım IPTV kurulum rehberi.',
    date: '2026-01-05',
    category: 'Kurulum',
  },
  {
    slug: 'iptv-donma-sorunu-cozumu',
    title: 'IPTV Donma Sorunu Nasıl Çözülür?',
    excerpt:
      'IPTV izlerken donma, takılma yaşıyorsanız bu rehber tam size göre. Adım adım sorun giderme.',
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
      'IPTV ve geleneksel kablo TV arasındaki farklar, avantajlar ve dezavantajlar.',
    date: '2024-12-15',
    category: 'Karşılaştırma',
  },
  // ─── Yeni 20 yazı ─────────────────────────────────────────────────────────────
  {
    slug: 'iptv-fiyatlari-2026',
    title: 'IPTV Fiyatları 2026: Güncel Paket Ücretleri ve Karşılaştırma Rehberi',
    excerpt:
      'Piyasada farklılık gösteren IPTV fiyatlarını analiz ediyor, en mantıklı seçimi nasıl yapacağınızı anlatıyoruz.',
    date: '2026-02-01',
    category: 'Rehber',
  },
  {
    slug: 'iptv-satin-almadan-once-10-soru',
    title: 'IPTV Satın Almadan Önce Bilmeniz Gereken 10 Kritik Soru',
    excerpt:
      'Doğru hizmeti seçerken internet hızı, cihaz uyumluluğu ve sunucu kalitesine dikkat etmeniz gerekenler.',
    date: '2026-02-03',
    category: 'Rehber',
  },
  {
    slug: 'iptv-ne-kadar-abonelik-maliyetleri',
    title: 'IPTV Ne Kadar? Aylık, 3 Aylık ve Yıllık Abonelik Maliyetleri',
    excerpt:
      'Aylık, 3 aylık, 6 aylık ve yıllık IPTV abonelik maliyetleri ve bütçe dostu seçenekler.',
    date: '2026-02-05',
    category: 'Rehber',
  },
  {
    slug: 'en-ucuz-iptv-paketleri',
    title: 'En Ucuz IPTV Paketleri: Kaliteden Ödün Vermeden Tasarruf Etme Rehberi',
    excerpt:
      'Bütçe dostu IPTV seçenekleri, tasarruf etmenin yolları ve ucuz IPTV alırken dikkat edilmesi gerekenler.',
    date: '2026-02-07',
    category: 'Rehber',
  },
  {
    slug: 'iptv-ucretleri-neden-degisir',
    title: 'IPTV Ücretleri Neden Değişir? Fiyatları Etkileyen 7 Faktör',
    excerpt:
      'Aynı hizmet gibi görünen IPTV paketleri arasındaki fiyat farklarının nedenlerini 7 faktörle açıklıyoruz.',
    date: '2026-02-09',
    category: 'Rehber',
  },
  {
    slug: 'iptv-nasil-kurulur-2026',
    title: 'IPTV Nasıl Kurulur? Adım Adım Kurulum Rehberi 2026',
    excerpt:
      'Smart TV, telefon, tablet ve bilgisayarda IPTV kurulumunu anlatan kapsamlı rehber.',
    date: '2026-02-11',
    category: 'Kurulum',
  },
  {
    slug: 'smart-tv-iptv-yukleme-tum-markalar',
    title: "Smart TV'ye IPTV Nasıl Yüklenir? Tüm Markalar İçin Rehber",
    excerpt:
      'Samsung, LG, Sony, Philips, Vestel, Arçelik ve diğer markalar için detaylı IPTV yükleme rehberi.',
    date: '2026-02-13',
    category: 'Kurulum',
  },
  {
    slug: 'telefonda-iptv-izleme',
    title: 'Telefonda IPTV İzleme: iOS ve Android İçin En İyi Uygulamalar',
    excerpt:
      'iPhone ve Android için en iyi IPTV uygulamaları, kurulum adımları ve mobil IPTV izleme ipuçları.',
    date: '2026-02-15',
    category: 'Uygulama',
  },
  {
    slug: 'iptv-kanal-listesi-guncelleme',
    title: 'IPTV Kanal Listesi Nasıl Güncellenir? M3U Link Ekleme Rehberi',
    excerpt:
      'M3U link ekleme, playlist güncelleme ve kanal listesi yönetimi hakkında detaylı bilgiler.',
    date: '2026-02-17',
    category: 'Rehber',
  },
  {
    slug: 'iptv-donma-buffering-cozumu-12-yontem',
    title: "IPTV'de Donma ve Buffering Sorunu Çözümü: 12 Etkili Yöntem",
    excerpt:
      'IPTV donma ve buffering sorunlarını gidermek için 12 etkili yöntem. Kesintisiz izleme için adım adım rehber.',
    date: '2026-02-19',
    category: 'Sorun Giderme',
  },
  {
    slug: 'iptv-vs-netflix-karsilastirma',
    title: 'IPTV vs Netflix: Hangisi Daha Avantajlı? Detaylı Karşılaştırma',
    excerpt:
      'Canlı TV, spor yayınları, güncel filmler ve fiyat açısından IPTV ile Netflix arasındaki farkları analiz ediyoruz.',
    date: '2026-02-21',
    category: 'Karşılaştırma',
  },
  {
    slug: 'en-iyi-iptv-uygulamalari-2026',
    title: "2026'nın En İyi IPTV Uygulamaları: TiviMate, IPTV Smarters ve Daha Fazlası",
    excerpt:
      'TiviMate, IPTV Smarters, GSE Smart IPTV ve diğer popüler uygulamaların karşılaştırması.',
    date: '2026-02-23',
    category: 'Uygulama',
  },
  {
    slug: 'yasal-iptv-vs-kacak-iptv',
    title: 'Yasal IPTV vs Kaçak IPTV: Farklar, Riskler ve Bilmeniz Gerekenler',
    excerpt:
      'Yasal ve kaçak IPTV arasındaki farklar, hukuki riskler ve güvenilir IPTV seçimi hakkında detaylı bilgiler.',
    date: '2026-02-25',
    category: 'Rehber',
  },
  {
    slug: 'iptv-uydu-tv-karsilastirmasi',
    title: 'IPTV ve Uydu TV Karşılaştırması: Hangisi Daha İyi?',
    excerpt:
      'Fiyat, kalite, içerik ve kullanım kolaylığı açısından IPTV ve uydu TV arasındaki farklar.',
    date: '2026-02-27',
    category: 'Karşılaştırma',
  },
  {
    slug: 'iptv-spor-paketleri-superlig',
    title: 'IPTV Spor Paketleri: Tüm Süper Lig Maçlarını Kaçırma Rehberi',
    excerpt:
      'IPTV spor paketlerinin içeriği, hangi liglerin bulunduğu ve maçları 4K izlemenin yolları.',
    date: '2026-03-01',
    category: 'İçerik',
  },
  {
    slug: 'vip-dizi-film-arsivi-iptv',
    title: 'VIP Dizi ve Film Arşivi Olan IPTV Hizmetleri: İçerik Rehberi',
    excerpt:
      '50.000+ içerik, Türkçe dublaj, altyazı seçenekleri ve VOD arşivi sunan IPTV hizmetleri.',
    date: '2026-03-03',
    category: 'İçerik',
  },
  {
    slug: '4k-iptv-izleme-ultra-hd',
    title: '4K IPTV İzleme: Ultra HD Kalite İçin Gerekenler',
    excerpt:
      'Ultra HD kalite için gerekli internet hızı, cihaz gereksinimleri ve 4K IPTV ayarları.',
    date: '2026-03-05',
    category: 'Rehber',
  },
  {
    slug: 'iptv-kullanimi-yasal-mi-2026',
    title: "IPTV Kullanımı Yasal mı? Türkiye'de IPTV Hukuki Durumu 2026",
    excerpt:
      "Türkiye'de IPTV hukuki durumu, yasal sınırlar ve dikkat edilmesi gerekenler.",
    date: '2026-03-07',
    category: 'Rehber',
  },
  {
    slug: 'guvenilir-iptv-saglayicisi-secimi',
    title: 'Güvenilir IPTV Sağlayıcısı Nasıl Seçilir? 8 Önemli Kriter',
    excerpt:
      '8 önemli kriter, dolandırıcılıktan korunma yöntemleri ve güvenli IPTV satın alma rehberi.',
    date: '2026-03-09',
    category: 'Rehber',
  },
  {
    slug: 'iptv-guvenlik-vpn-ip-koruma',
    title: "IPTV'de Güvenlik: VPN Kullanımı ve IP Koruma Rehberi",
    excerpt:
      'VPN kullanımı, IP koruma, güvenli IPTV izleme ve veri güvenliği hakkında detaylı bilgiler.',
    date: '2026-03-11',
    category: 'Rehber',
  },
  {
    slug: 'iptv-satin-al',
    title: 'IPTV Satın Al: Donmasız 4K Premium IPTV Aboneliği – Galya IPTV',
    excerpt:
      'IPTV satın almadan önce bilmeniz gereken her şey: paket fiyatları, 4K yayın altyapısı ve ücretsiz test yayını.',
    date: '2026-03-13',
    category: 'Rehber',
  },
];

const categoryColors: Record<string, string> = {
  Rehber:          'bg-[#7c6fcd]/20 text-[#7c6fcd]',
  Kurulum:         'bg-blue-900/40 text-blue-300',
  Uygulama:        'bg-pink-900/40 text-pink-300',
  'Sorun Giderme': 'bg-red-900/40 text-red-300',
  Karşılaştırma:   'bg-amber-900/40 text-amber-300',
  İçerik:          'bg-emerald-900/40 text-emerald-300',
};

const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Galya IPTV Blog',
  url: 'https://galyaiptv.com.tr/blog',
  description: 'IPTV rehberleri, ipuçları ve haberleri',
  publisher: {
    '@type': 'Organization',
    name: 'Galya IPTV',
    url: 'https://galyaiptv.com.tr',
    logo: { '@type': 'ImageObject', url: 'https://galyaiptv.com.tr/logo.png' },
  },
  blogPost: posts.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    url: `https://galyaiptv.com.tr/blog/${p.slug}`,
    datePublished: p.date,
    description: p.excerpt,
  })),
};

// Kategorilere göre öne çıkan yazı — en son tarihli
const featured = [...posts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
)[0];

const rest = posts
  .filter((p) => p.slug !== featured.slug)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#18181f]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#f1f0f5]">
            Galya <span className="text-[#7c6fcd]">IPTV</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-[#9b98b0]">
            <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
            <Link href="/blog"      className="font-medium text-white" aria-current="page">Blog</Link>
            <Link href="/iletisim"  className="transition-colors hover:text-white">İletişim</Link>
            <Link href="/araclar"   className="transition-colors hover:text-white">Araçlar</Link>
            <a
              href="https://wa.me/447441921660?text=Merhaba%2C%20%C3%BCcretsiz%20test%20almak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[#7c6fcd]/40 bg-[#7c6fcd]/10 px-4 py-2 text-sm font-medium text-[#7c6fcd] transition-all hover:bg-[#7c6fcd]/20 hover:text-white"
            >
              Ücretsiz Test
            </a>
          </div>
        </nav>
      </header>

      <main className="bg-[#18181f] text-[#f1f0f5]">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-16 pt-16">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[350px] w-[500px] rounded-full bg-[#7c6fcd]/6 blur-3xl" />
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#22222c] px-4 py-1.5 text-xs text-[#9b98b0]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7c6fcd]" />
              {posts.length} makale
            </div>
            <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              IPTV Blog
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[#9b98b0] md:text-lg">
              IPTV kurulum rehberleri, en iyi uygulamalar, fiyat karşılaştırmaları ve güncel haberler.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 pb-24">

          {/* ── Öne Çıkan Makale ───────────────────────────────────────────── */}
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-10 block rounded-2xl border border-[#7c6fcd]/30 bg-gradient-to-br from-[#7c6fcd]/15 to-[#7c6fcd]/[0.04] p-6 transition-all duration-200 hover:border-[#7c6fcd]/60 hover:shadow-xl hover:shadow-[#7c6fcd]/10"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gradient-to-r from-[#7c6fcd] to-pink-500 px-3 py-1 text-[11px] font-semibold text-white">
                ✨ Öne Çıkan
              </span>
              <span className={`rounded-md px-2 py-0.5 text-xs ${categoryColors[featured.category] ?? 'bg-white/[0.06] text-[#9b98b0]'}`}>
                {featured.category}
              </span>
              <span className="ml-auto text-xs text-[#6b6880]">{featured.date}</span>
            </div>
            <h2 className="mb-2 text-xl font-bold leading-snug text-white transition-colors group-hover:text-[#7c6fcd] md:text-2xl">
              {featured.title}
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-[#9b98b0]">{featured.excerpt}</p>
            <span className="text-sm font-medium text-[#7c6fcd]">Devamını Oku →</span>
          </Link>

          {/* ── Makale Izgarası ─────────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <article key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-white/[0.08] bg-[#141418] p-5 transition-all duration-200 hover:border-[#7c6fcd]/40 hover:bg-[#22222c] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#7c6fcd]/5"
                >
                  {/* Kategori + Tarih */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${categoryColors[post.category] ?? 'bg-white/[0.06] text-[#9b98b0]'}`}>
                      {post.category}
                    </span>
                    <span className="ml-auto text-[11px] text-[#6b6880]">{post.date}</span>
                  </div>

                  {/* Başlık */}
                  <h2 className="mb-2 flex-1 text-sm font-bold leading-snug text-[#f1f0f5] transition-colors group-hover:text-[#7c6fcd]">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-[#9b98b0]">
                    {post.excerpt}
                  </p>

                  <span className="text-xs font-semibold text-[#7c6fcd]">Devamını Oku →</span>
                </Link>
              </article>
            ))}
          </div>

          {/* ── CTA Bandı ───────────────────────────────────────────────────── */}
          <div className="mt-16 rounded-2xl border border-[#7c6fcd]/30 bg-gradient-to-r from-[#7c6fcd]/15 to-pink-900/10 p-8 text-center">
            <h2 className="mb-2 text-xl font-bold text-white">
              Donmasız 4K IPTV&apos;yi Ücretsiz Deneyin
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-[#9b98b0]">
              Paketleri inceleyin, 12 saatlik ücretsiz test isteyin ve satın almadan önce kaliteyi kendiniz görün.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/#paketler"
                className="rounded-xl bg-[#7c6fcd] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7c6fcd]/25 transition-all hover:bg-[#6358b8]"
              >
                Paketleri İncele
              </Link>
              <a
                href="https://wa.me/447441921660?text=Merhaba%2C%20%C3%BCcretsiz%20test%20yay%C4%B1n%C4%B1%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/[0.08] bg-[#22222c] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/[0.06]"
              >
                💬 Ücretsiz Test Al
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#141418] px-6 py-10 text-center text-sm text-[#6b6880]">
        <p className="mb-1 font-semibold text-[#9b98b0]">Galya IPTV</p>
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs">
          <Link href="/#paketler"         className="transition-colors hover:text-[#f1f0f5]">IPTV Fiyatları</Link>
          <Link href="/blog"              className="transition-colors hover:text-[#f1f0f5]">Blog</Link>
          <Link href="/iletisim"          className="transition-colors hover:text-[#f1f0f5]">İletişim</Link>
          <Link href="/blog/iptv-nedir"   className="transition-colors hover:text-[#f1f0f5]">IPTV Nedir?</Link>
          <Link href="/blog/iptv-fiyatlari-2026" className="transition-colors hover:text-[#f1f0f5]">IPTV Fiyatları</Link>
        </div>
      </footer>
    </>
  );
}
