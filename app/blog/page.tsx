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

const categoryColors: Record<string, string> = {
  Rehber:           'bg-[#7c6fcd]/20 text-[#7c6fcd]',
  Kurulum:          'bg-blue-900/40 text-blue-300',
  Uygulama:         'bg-pink-900/40 text-pink-300',
  'Sorun Giderme':  'bg-red-900/40 text-red-300',
  Karşılaştırma:    'bg-amber-900/40 text-amber-300',
  İçerik:           'bg-emerald-900/40 text-emerald-300',
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

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#18181f]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#f1f0f5]">
            Galya<span className="text-[#7c6fcd]">Stream</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-[#9b98b0]">
            <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
            <Link href="/blog" className="font-medium text-white" aria-current="page">Blog</Link>
            <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
            <Link href="/araclar" className="transition-colors hover:text-white">Araçlar</Link>
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
        <section className="relative overflow-hidden px-6 pb-16 pt-16">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[350px] w-[500px] rounded-full bg-[#7c6fcd]/6 blur-3xl" />
          <div className="relative mx-auto max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#22222c] px-4 py-1.5 text-xs text-[#9b98b0]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7c6fcd]" />
              {blogPosts.length} makale
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

          <Link
            href={'/blog/' + featured.slug}
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
            <p className="mb-4 text-sm leading-relaxed text-[#9b98b0]">{featured.description}</p>
            <span className="text-sm font-medium text-[#7c6fcd]">Devamını Oku →</span>
          </Link>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <article key={post.slug}>
                <Link
                  href={'/blog/' + post.slug}
                  className="group flex h-full flex-col rounded-xl border border-white/[0.08] bg-[#141418] p-5 transition-all duration-200 hover:border-[#7c6fcd]/40 hover:bg-[#22222c] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#7c6fcd]/5"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${categoryColors[post.category] ?? 'bg-white/[0.06] text-[#9b98b0]'}`}>
                      {post.category}
                    </span>
                    <span className="ml-auto text-[11px] text-[#6b6880]">{post.date}</span>
                  </div>
                  <h2 className="mb-2 flex-1 text-sm font-bold leading-snug text-[#f1f0f5] transition-colors group-hover:text-[#7c6fcd]">
                    {post.title}
                  </h2>
                  <p className="mb-4 line-clamp-3 text-xs leading-relaxed text-[#9b98b0]">
                    {post.description}
                  </p>
                  <span className="text-xs font-semibold text-[#7c6fcd]">Devamını Oku →</span>
                </Link>
              </article>
            ))}
          </div>

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

      <footer className="border-t border-white/[0.08] bg-[#141418] px-6 py-10 text-center text-sm text-[#6b6880]">
        <p className="mb-1 font-semibold text-[#9b98b0]">GalyaStream</p>
        <p>© {new Date().getFullYear()} GalyaStream. Tüm hakları saklıdır.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs">
          <Link href="/#paketler" className="transition-colors hover:text-[#f1f0f5]">IPTV Fiyatları</Link>
          <Link href="/blog" className="transition-colors hover:text-[#f1f0f5]">Blog</Link>
          <Link href="/iletisim" className="transition-colors hover:text-[#f1f0f5]">İletişim</Link>
          <Link href="/blog/iptv-nedir" className="transition-colors hover:text-[#f1f0f5]">IPTV Nedir?</Link>
          <Link href="/blog/iptv-fiyatlari-2026" className="transition-colors hover:text-[#f1f0f5]">IPTV Fiyatları</Link>
        </div>
      </footer>
    </>
  );
}
