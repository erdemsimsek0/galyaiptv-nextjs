import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, blogPosts } from '@/lib/blog-posts';

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = 'https://www.galyastream.com/blog/' + post.slug;
  const ogImage = 'https://www.galyastream.com/og-image.png';
  return {
    title: post.title + ' | GalyaStream Blog',
    description: post.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title + ' | GalyaStream Blog',
      description: post.description,
      url,
      siteName: 'GalyaStream',
      locale: 'tr_TR',
      type: 'article',
      publishedTime: post.date,
      authors: ['GalyaStream'],
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title + ' | GalyaStream Blog',
      description: post.description,
      images: [ogImage],
    },
  };
}

const categoryColors: Record<string, string> = {
  Rehber:           'bg-[#7c6fcd]/20 text-[#7c6fcd]',
  Kurulum:          'bg-blue-900/40 text-blue-300',
  Uygulama:         'bg-pink-900/40 text-pink-300',
  'Sorun Giderme':  'bg-red-900/40 text-red-300',
  Karşılaştırma:    'bg-amber-900/40 text-amber-300',
  İçerik:           'bg-emerald-900/40 text-emerald-300',
};

function getRelated(slug: string, category: string, limit = 3) {
  return blogPosts
    .filter((p) => p.slug !== slug && p.category === category)
    .slice(0, limit);
}

function md(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    if (line.startsWith('### ')) {
      out.push('<h3 style="margin-top:1.5rem;margin-bottom:0.5rem;font-size:1.1rem;font-weight:700;color:#f1f0f5">' + esc(line.slice(4)) + '</h3>');
    } else if (line.startsWith('## ')) {
      out.push('<h2 style="margin-top:2rem;margin-bottom:0.75rem;font-size:1.25rem;font-weight:700;color:#f1f0f5">' + esc(line.slice(3)) + '</h2>');
    } else if (line.startsWith('# ')) {
      out.push('<h2 style="margin-top:0;margin-bottom:1rem;font-size:1.4rem;font-weight:700;color:#f1f0f5">' + esc(line.slice(2)) + '</h2>');
    } else if (/^\|[\s\-:|]+\|$/.test(line)) {
      // tablo ayraç satırı — atla
    } else if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter(Boolean).map((c) => c.trim());
      out.push('<div style="display:flex;gap:0.5rem;padding:0.4rem 0;border-bottom:1px solid rgba(255,255,255,0.08)">' +
        cells.map((c) => '<span style="flex:1;font-size:0.75rem;color:#9b98b0">' + esc(c) + '</span>').join('') +
        '</div>');
    } else if (/^[-*]\s/.test(line)) {
      out.push('<div style="display:flex;gap:0.5rem;margin:0.2rem 0"><span style="margin-top:0.4rem;width:6px;height:6px;border-radius:50%;background:#7c6fcd;flex-shrink:0"></span><span style="font-size:0.85rem;color:#9b98b0">' + inlineMd(line.slice(2)) + '</span></div>');
    } else if (/^\d+\.\s/.test(line)) {
      out.push('<div style="font-size:0.85rem;color:#9b98b0;margin:0.2rem 0;padding-left:1.2rem">' + inlineMd(line.replace(/^\d+\.\s/, '')) + '</div>');
    } else if (line.trim() === '') {
      out.push('<div style="height:0.5rem"></div>');
    } else {
      out.push('<p style="font-size:0.875rem;color:#9b98b0;line-height:1.75;margin:0.25rem 0">' + inlineMd(line) + '</p>');
    }
  }
  return out.join('\n');
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMd(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#f1f0f5">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:0.1rem 0.3rem;border-radius:4px;font-family:monospace;font-size:0.8rem;color:#f1f0f5">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#7c6fcd;text-decoration:underline">$1</a>');
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related   = getRelated(post.slug, post.category);
  const postUrl   = 'https://www.galyastream.com/blog/' + post.slug;
  const catClass  = categoryColors[post.category] ?? 'bg-white/[0.06] text-[#9b98b0]';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    url: postUrl,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'GalyaStream', url: 'https://www.galyastream.com' },
    publisher: {
      '@type': 'Organization',
      name: 'GalyaStream',
      url: 'https://www.galyastream.com',
      logo: { '@type': 'ImageObject', url: 'https://www.galyastream.com/logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    image: 'https://www.galyastream.com/og-image.png',
    inLanguage: 'tr',
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://www.galyastream.com/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.galyastream.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#18181f]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#f1f0f5]">
            Galya<span className="text-[#7c6fcd]">Stream</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-[#9b98b0]">
            <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
            <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
            <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
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

        <nav aria-label="Breadcrumb" className="border-b border-white/[0.06] px-6 py-3">
          <ol className="mx-auto flex max-w-3xl items-center gap-2 text-xs text-[#6b6880]">
            <li><Link href="/" className="transition-colors hover:text-[#9b98b0]">Ana Sayfa</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/blog" className="transition-colors hover:text-[#9b98b0]">Blog</Link></li>
            <li aria-hidden="true">/</li>
            <li className="truncate text-[#9b98b0]" aria-current="page">{post.title}</li>
          </ol>
        </nav>

        <section className="relative overflow-hidden px-6 pb-12 pt-12">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-[#7c6fcd]/5 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${catClass}`}>
                {post.category}
              </span>
              <time dateTime={post.date} className="text-xs text-[#6b6880]">{post.date}</time>
            </div>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
              {post.title}
            </h1>
            <p className="text-base leading-relaxed text-[#9b98b0]">{post.description}</p>
          </div>
        </section>

        <article className="px-6 pb-16">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-white/[0.08] bg-[#141418] p-6 md:p-8">
              <div dangerouslySetInnerHTML={{ __html: md(post.content) }} />
            </div>

            <div className="mt-8 rounded-xl border border-[#7c6fcd]/20 bg-[#7c6fcd]/5 p-5">
              <p className="mb-3 text-sm font-semibold text-white">📚 İlgili Rehberler</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: '/blog/iptv-nedir', label: 'IPTV Nedir?' },
                  { href: '/blog/iptv-fiyatlari-2026', label: 'IPTV Fiyatları' },
                  { href: '/blog/iptv-nasil-kurulur-2026', label: 'Kurulum Rehberi' },
                  { href: '/blog/iptv-donma-sorunu-cozumu', label: 'Donma Çözümü' },
                  { href: '/#paketler', label: 'Paketleri İncele' },
                ].filter((l) => l.href !== '/blog/' + post.slug).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg border border-[#7c6fcd]/20 bg-[#7c6fcd]/10 px-3 py-1.5 text-xs font-medium text-[#7c6fcd] transition-colors hover:bg-[#7c6fcd]/20"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </article>

        <section className="border-t border-white/[0.08] px-6 py-16">
          <div className="mx-auto max-w-3xl rounded-2xl border border-[#7c6fcd]/30 bg-gradient-to-r from-[#7c6fcd]/15 to-pink-900/10 p-8 text-center">
            <h2 className="mb-2 text-xl font-bold text-white">
              Donmasız 4K IPTV&apos;yi Ücretsiz Deneyin
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-[#9b98b0]">
              12 saatlik ücretsiz test yayını ile kaliteyi kendiniz görün. Kredi kartı gerekmez.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href="https://wa.me/447441921660?text=Merhaba%2C%20%C3%BCcretsiz%20test%20yay%C4%B1n%C4%B1%20istiyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[#25d366] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5d]"
              >
                💬 Ücretsiz Test Al
              </a>
              <Link
                href="/#paketler"
                className="rounded-xl bg-[#7c6fcd] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7c6fcd]/20 transition-all hover:bg-[#6358b8]"
              >
                Paketleri İncele
              </Link>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="border-t border-white/[0.08] px-6 py-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 text-xl font-bold text-white">İlgili Yazılar</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {related.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={'/blog/' + rel.slug}
                    className="group flex flex-col rounded-xl border border-white/[0.08] bg-[#141418] p-4 transition-all hover:border-[#7c6fcd]/40 hover:bg-[#22222c]"
                  >
                    <span className={`mb-2 inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${categoryColors[rel.category] ?? 'bg-white/[0.06] text-[#9b98b0]'}`}>
                      {rel.category}
                    </span>
                    <p className="flex-1 text-sm font-semibold leading-snug text-[#f1f0f5] transition-colors group-hover:text-[#7c6fcd]">
                      {rel.title}
                    </p>
                    <span className="mt-3 text-xs text-[#7c6fcd]">Oku →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>

      <footer className="border-t border-white/[0.08] bg-[#141418] px-6 py-10 text-center text-sm text-[#6b6880]">
        <p className="mb-1 font-semibold text-[#9b98b0]">GalyaStream</p>
        <p>© {new Date().getFullYear()} GalyaStream. Tüm hakları saklıdır.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs">
          <Link href="/" className="transition-colors hover:text-[#f1f0f5]">Ana Sayfa</Link>
          <Link href="/#paketler" className="transition-colors hover:text-[#f1f0f5]">IPTV Fiyatları</Link>
          <Link href="/blog" className="transition-colors hover:text-[#f1f0f5]">Blog</Link>
          <Link href="/iletisim" className="transition-colors hover:text-[#f1f0f5]">İletişim</Link>
          <Link href="/blog/iptv-nedir" className="transition-colors hover:text-[#f1f0f5]">IPTV Nedir?</Link>
        </div>
      </footer>
    </>
  );
}
