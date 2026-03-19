import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog-posts';

export const metadata: Metadata = {
  title: 'IPTV Blog – Rehberler, İpuçları ve Haberler | GalyaStream',
  description:
    'IPTV kurulum rehberleri, en iyi player uygulamaları, fiyat karşılaştırmaları, donma çözümleri ve güncel IPTV haberleri. GalyaStream Blog.',
  alternates: { canonical: 'https://www.galyastream.com/blog' },
  openGraph: {
    title: 'IPTV Blog – Rehberler, İpuçları ve Haberler | GalyaStream',
    description: 'IPTV kurulum rehberleri, en iyi uygulamalar, fiyat karşılaştırmaları ve haberler.',
    url: 'https://www.galyastream.com/blog',
    siteName: 'GalyaStream',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IPTV Blog | GalyaStream',
    description: 'IPTV rehberleri, kurulum ipuçları ve en iyi IPTV paketleri.',
  },
};

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

const categoryColors: Record<string, string> = {
  Rehber: 'border-[#3730a3] bg-[#1e1b4b] text-[#818cf8]',
  Kurulum: 'border-[#1e3a5f] bg-[#0d1a2a] text-[#93c5fd]',
  Uygulama: 'border-cyan-500/20 bg-cyan-950/40 text-cyan-300',
  'Sorun Giderme': 'border-amber-500/20 bg-amber-950/30 text-amber-300',
  Karşılaştırma: 'border-emerald-500/20 bg-emerald-950/30 text-emerald-300',
  İçerik: 'border-sky-500/20 bg-sky-950/30 text-sky-300',
};

const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'GalyaStream Blog',
  url: 'https://www.galyastream.com/blog',
  description: 'IPTV rehberleri, ipuçları ve haberleri',
  publisher: {
    '@type': 'Organization',
    name: 'GalyaStream',
    url: 'https://www.galyastream.com',
    logo: { '@type': 'ImageObject', url: 'https://www.galyastream.com/logo.png' },
  },
  blogPost: blogPosts.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    url: 'https://www.galyastream.com/blog/' + p.slug,
    datePublished: p.date,
    description: p.description,
  })),
};

export default function BlogPage() {
  const sorted = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const featured = sorted[0];
  const rest = sorted.slice(1);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }}
      />

      <div className={`min-h-screen ${SURFACE.page}`}>
        <header className="sticky top-0 z-50 border-b border-[#1e3a5f] bg-[#07111f]/90 backdrop-blur-md">
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="text-lg font-bold tracking-tight text-white">
              Galya<span className={INLINE_ACCENT_CLASS}>Stream</span>
            </Link>
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/#paketler" className={NAV_LINK_CLASS}>Paketler</Link>
              <Link href="/blog" className="rounded-xl bg-[#162035] px-4 py-1.5 text-sm font-medium text-white" aria-current="page">Blog</Link>
              <Link href="/iletisim" className={NAV_LINK_CLASS}>İletişim</Link>
              <Link href="/araclar" className={NAV_LINK_CLASS}>Araçlar</Link>
            </div>
            <a
              href="https://wa.me/447441921660?text=Merhaba%2C%20%C3%BCcretsiz%20test%20almak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-xl border border-[#1e3a5f] bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition-all hover:border-[#3b82f6]/50 hover:bg-[#162035] md:inline-flex"
            >
              Ücretsiz Test
            </a>
          </nav>
        </header>

        <main>
          <section className="relative overflow-hidden px-6 pb-20 pt-16">
            <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[520px] rounded-full bg-[#1e3a5f]/25 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-8 h-[340px] w-[420px] rounded-full bg-[#2563eb]/10 blur-3xl" />
            <div className="relative mx-auto max-w-5xl text-center">
              <div className={`mb-5 inline-flex items-center gap-2 px-4 py-1.5 text-xs ${SURFACE.pill}`}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {blogPosts.length} makale · Güncel IPTV rehberleri
              </div>
              <h1 className="mx-auto mb-4 max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">
                IPTV Blog içeriklerini ana sayfa deneyimiyle aynı görsel dilde keşfedin
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#9ca3af] md:text-lg">
                Kurulum rehberleri, en iyi uygulamalar, fiyat karşılaştırmaları ve sorun çözüm içerikleri;
                GalyaStream&apos;in mavi odaklı tasarım sistemiyle tek bir merkezde.
              </p>
            </div>
          </section>

          <section className={`px-6 py-16 ${SURFACE.section}`}>
            <div className="mx-auto max-w-5xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">Öne çıkan içerik</p>
                  <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">İlk okunacak makale</h2>
                </div>
                <Link href="/#paketler" className="hidden text-sm font-medium text-[#8b9ab3] transition-colors hover:text-white md:inline-flex">
                  Paketlere göz at →
                </Link>
              </div>

              <Link href={'/blog/' + featured.slug} className={`group block p-7 md:p-8 ${SURFACE.card}`}>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#3b82f6] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#3b82f6]/30">
                    Öne Çıkan
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryColors[featured.category] ?? 'border-[#1e3a5f] bg-[#0d1a2a] text-[#9ca3af]'}`}>
                    {featured.category}
                  </span>
                  <span className="ml-auto text-xs text-[#6b7280]">{featured.date}</span>
                </div>
                <h3 className="mb-3 text-2xl font-bold leading-tight text-white transition-colors group-hover:text-[#93c5fd] md:text-3xl">
                  {featured.title}
                </h3>
                <p className="max-w-3xl text-sm leading-7 text-[#9ca3af] md:text-base">
                  {featured.description}
                </p>
                <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-[#818cf8]">
                  <span>Devamını Oku</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </div>
          </section>

          <section className={`px-6 py-16 ${SURFACE.section}`}>
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 text-center">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">Tüm yazılar</p>
                <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Rehberler, ipuçları ve karşılaştırmalar</h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <article key={post.slug}>
                    <Link href={'/blog/' + post.slug} className={`group flex h-full flex-col p-6 ${SURFACE.card}`}>
                      <div className="mb-4 flex items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${categoryColors[post.category] ?? 'border-[#1e3a5f] bg-[#0d1a2a] text-[#9ca3af]'}`}>
                          {post.category}
                        </span>
                        <span className="ml-auto text-[11px] text-[#6b7280]">{post.date}</span>
                      </div>
                      <h3 className="mb-3 flex-1 text-lg font-bold leading-snug text-white transition-colors group-hover:text-[#93c5fd]">
                        {post.title}
                      </h3>
                      <p className="mb-5 line-clamp-3 text-sm leading-7 text-[#9ca3af]">
                        {post.description}
                      </p>
                      <span className="text-sm font-semibold text-[#818cf8] transition-colors group-hover:text-[#93c5fd]">
                        Devamını Oku →
                      </span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className={`px-6 py-20 ${SURFACE.section}`}>
            <div className="mx-auto max-w-3xl text-center">
              <div className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-8 shadow-[0_24px_70px_rgba(3,7,18,0.4)] md:p-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3730a3] bg-[#1e1b4b] px-4 py-1.5 text-xs text-[#818cf8]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#818cf8]" />
                  Önce ücretsiz deneyin, sonra paketinizi seçin
                </div>
                <h2 className="mb-3 text-2xl font-bold tracking-tight text-white md:text-4xl">
                  Donmasız 4K IPTV&apos;yi ücretsiz test edin
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-sm leading-7 text-[#9ca3af] md:text-base">
                  Ana sayfadaki dönüşüm diliyle aynı akışı koruyun: paketleri inceleyin, 12 saatlik ücretsiz test
                  isteyin ve satın almadan önce yayın kalitesini kendiniz görün.
                </p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/#paketler" className={PRIMARY_BUTTON_CLASS}>
                    ⚡ Paketleri İncele
                  </Link>
                  <a
                    href="https://wa.me/447441921660?text=Merhaba%2C%20%C3%BCcretsiz%20test%20yay%C4%B1n%C4%B1%20istiyorum."
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${SECONDARY_BUTTON_CLASS} flex items-center justify-center gap-2 text-[#25d366] hover:border-[#25d366]/40 hover:bg-[#25d366]/5`}
                  >
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
                <Link href="/#platformlar" className="transition-colors hover:text-white">Desteklenen Cihazlar</Link>
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
