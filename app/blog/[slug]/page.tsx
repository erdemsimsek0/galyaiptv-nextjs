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
      out.push('<h3 style="margin-top:1.75rem;margin-bottom:0.5rem;font-size:1.1rem;font-weight:700;color:#ffffff">' + esc(line.slice(4)) + '</h3>');
    } else if (line.startsWith('## ')) {
      out.push('<h2 style="margin-top:2.25rem;margin-bottom:0.75rem;font-size:1.4rem;font-weight:700;color:#ffffff">' + esc(line.slice(3)) + '</h2>');
    } else if (line.startsWith('# ')) {
      out.push('<h2 style="margin-top:0;margin-bottom:1rem;font-size:1.55rem;font-weight:800;color:#ffffff">' + esc(line.slice(2)) + '</h2>');
    } else if (/^\|[\s\-:|]+\|$/.test(line)) {
      // tablo ayraç satırı — atla
    } else if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter(Boolean).map((c) => c.trim());
      out.push('<div style="display:flex;gap:0.75rem;padding:0.55rem 0;border-bottom:1px solid rgba(30,58,95,0.9)">' +
        cells.map((c) => '<span style="flex:1;font-size:0.82rem;color:#9ca3af">' + esc(c) + '</span>').join('') +
        '</div>');
    } else if (/^[-*]\s/.test(line)) {
      out.push('<div style="display:flex;gap:0.65rem;margin:0.35rem 0"><span style="margin-top:0.55rem;width:6px;height:6px;border-radius:50%;background:#3b82f6;flex-shrink:0"></span><span style="font-size:0.98rem;color:#9ca3af;line-height:1.8">' + inlineMd(line.slice(2)) + '</span></div>');
    } else if (/^\d+\.\s/.test(line)) {
      out.push('<div style="font-size:0.98rem;color:#9ca3af;line-height:1.8;margin:0.3rem 0;padding-left:1.25rem">' + inlineMd(line.replace(/^\d+\.\s/, '')) + '</div>');
    } else if (line.trim() === '') {
      out.push('<div style="height:0.45rem"></div>');
    } else {
      out.push('<p style="font-size:1rem;color:#9ca3af;line-height:1.85;margin:0.25rem 0">' + inlineMd(line) + '</p>');
    }
  }
  return out.join('\n');
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineMd(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#ffffff">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(13,26,42,0.95);border:1px solid rgba(30,58,95,0.9);padding:0.15rem 0.35rem;border-radius:6px;font-family:monospace;font-size:0.86rem;color:#ffffff">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#818cf8;text-decoration:underline">$1</a>');
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelated(post.slug, post.category);
  const postUrl = 'https://www.galyastream.com/blog/' + post.slug;
  const catClass = categoryColors[post.category] ?? 'border-[#1e3a5f] bg-[#0d1a2a] text-[#9ca3af]';

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

      <div className={`min-h-screen ${SURFACE.page}`}>
        <header className="sticky top-0 z-50 border-b border-[#1e3a5f] bg-[#07111f]/90 backdrop-blur-md">
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="text-lg font-bold tracking-tight text-white">
              Galya<span className={INLINE_ACCENT_CLASS}>Stream</span>
            </Link>
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/#paketler" className={NAV_LINK_CLASS}>Paketler</Link>
              <Link href="/blog" className="rounded-xl bg-[#162035] px-4 py-1.5 text-sm font-medium text-white">Blog</Link>
              <Link href="/iletisim" className={NAV_LINK_CLASS}>İletişim</Link>
            </div>
            <a href="https://wa.me/447441921660?text=Merhaba%2C%20%C3%BCcretsiz%20test%20almak%20istiyorum" target="_blank" rel="noopener noreferrer" className="hidden rounded-xl border border-[#1e3a5f] bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition-all hover:border-[#3b82f6]/50 hover:bg-[#162035] md:inline-flex">
              Ücretsiz Test
            </a>
          </nav>
        </header>

        <main>
          <nav aria-label="Breadcrumb" className="border-b border-[#1e3a5f] bg-[#0d1117] px-6 py-3">
            <ol className="mx-auto flex max-w-5xl items-center gap-2 text-xs text-[#6b7280]">
              <li><Link href="/" className="transition-colors hover:text-white">Ana Sayfa</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/blog" className="transition-colors hover:text-white">Blog</Link></li>
              <li aria-hidden="true">/</li>
              <li className="truncate text-[#9ca3af]" aria-current="page">{post.title}</li>
            </ol>
          </nav>

          <section className="relative overflow-hidden px-6 pb-16 pt-14">
            <div className="pointer-events-none absolute left-0 top-0 h-[360px] w-[520px] rounded-full bg-[#1e3a5f]/25 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-10 h-[280px] w-[420px] rounded-full bg-[#2563eb]/10 blur-3xl" />
            <div className="relative mx-auto max-w-5xl">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${catClass}`}>{post.category}</span>
                <span className={`px-3 py-1 text-xs ${SURFACE.pill}`}>Yayın tarihi: {post.date}</span>
              </div>
              <h1 className="mb-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                {post.title}
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-[#9ca3af] md:text-lg">
                {post.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="https://wa.me/447441921660?text=Merhaba%2C%20%C3%BCcretsiz%20test%20yay%C4%B1n%C4%B1%20istiyorum." target="_blank" rel="noopener noreferrer" className={`${PRIMARY_BUTTON_CLASS} flex items-center justify-center gap-2`}>
                  ⚡ Ücretsiz Test Al
                </a>
                <Link href="/#paketler" className={`${SECONDARY_BUTTON_CLASS} flex items-center justify-center gap-2`}>
                  Paketleri İncele
                </Link>
                <Link href="/iletisim" className={`${SECONDARY_BUTTON_CLASS} flex items-center justify-center gap-2`}>
                  İletişime Geç
                </Link>
              </div>
            </div>
          </section>

          <section className={`px-6 pb-16 ${SURFACE.section}`}>
            <div className="mx-auto max-w-5xl pt-16">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                <article className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-6 shadow-[0_24px_70px_rgba(3,7,18,0.35)] md:p-8">
                  <div dangerouslySetInnerHTML={{ __html: md(post.content) }} />
                </article>

                <aside className="space-y-5">
                  <div className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-5 shadow-[0_18px_48px_rgba(3,7,18,0.28)]">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">İç linkler</p>
                    <div className="flex flex-col gap-2">
                      {[
                        { href: '/blog/iptv-nedir', label: 'IPTV Nedir?' },
                        { href: '/blog/iptv-fiyatlari-2026', label: 'IPTV Fiyatları' },
                        { href: '/blog/iptv-nasil-kurulur-2026', label: 'Kurulum Rehberi' },
                        { href: '/blog/iptv-donma-sorunu-cozumu', label: 'Donma Çözümü' },
                        { href: '/#paketler', label: 'Paketleri İncele' },
                        { href: '/iletisim', label: 'İletişim' },
                      ].filter((l) => l.href !== '/blog/' + post.slug).map((link) => (
                        <Link key={link.href} href={link.href} className="rounded-xl border border-[#1e3a5f] bg-[#0d1a2a] px-4 py-3 text-sm font-medium text-[#9ca3af] transition-all hover:border-[#3b82f6]/50 hover:bg-[#162035] hover:text-white">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-5 shadow-[0_18px_48px_rgba(3,7,18,0.28)]">
                    <p className="mb-2 text-sm font-semibold text-white">Bu rehberi okuduktan sonra</p>
                    <p className="mb-4 text-sm leading-7 text-[#9ca3af]">İsterseniz ücretsiz test alın, isterseniz paket sayfasına geçip fiyatları inceleyin.</p>
                    <div className="flex flex-col gap-3">
                      <a href="https://wa.me/447441921660?text=Merhaba%2C%20%C3%BCcretsiz%20test%20yay%C4%B1n%C4%B1%20istiyorum." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1ebe5d]">
                        💬 Test Talep Et
                      </a>
                      <Link href="/#paketler" className={`${PRIMARY_BUTTON_CLASS} flex items-center justify-center gap-2 px-4 py-3`}>
                        Paketleri Gör
                      </Link>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </section>

          <section className={`px-6 py-20 ${SURFACE.section}`}>
            <div className="mx-auto max-w-3xl text-center">
              <div className="rounded-2xl border border-[#1e3a5f] bg-[#111827] p-8 shadow-[0_24px_70px_rgba(3,7,18,0.4)] md:p-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3730a3] bg-[#1e1b4b] px-4 py-1.5 text-xs text-[#818cf8]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#818cf8]" />
                  Blog içerikleri ana sayfa CTA diliyle hizalandı
                </div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight text-white md:text-4xl">Okuduğunuz rehberden sonraki adımı hemen seçin</h2>
                <p className="mx-auto mb-8 max-w-xl text-sm leading-7 text-[#9ca3af] md:text-base">
                  Kurulum rehberini tamamladıysanız ücretsiz test alın, fiyatları görün veya iletişim sayfasına geçip destek alın.
                </p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                  <a href="https://wa.me/447441921660?text=Merhaba%2C%20%C3%BCcretsiz%20test%20yay%C4%B1n%C4%B1%20istiyorum." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1ebe5d]">
                    💬 Ücretsiz Test Al
                  </a>
                  <Link href="/#paketler" className={PRIMARY_BUTTON_CLASS}>Paketleri İncele</Link>
                  <Link href="/iletisim" className={SECONDARY_BUTTON_CLASS}>İletişim</Link>
                </div>
              </div>
            </div>
          </section>

          {related.length > 0 && (
            <section className={`px-6 py-16 ${SURFACE.section}`}>
              <div className="mx-auto max-w-5xl">
                <div className="mb-8 text-center">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#818cf8]">İlgili yazılar</p>
                  <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Aynı kategoride okumaya devam edin</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((rel) => (
                    <Link key={rel.slug} href={'/blog/' + rel.slug} className={`group flex flex-col p-6 ${SURFACE.card}`}>
                      <span className={`mb-3 inline-flex w-fit rounded-full border px-3 py-1 text-[11px] font-semibold ${categoryColors[rel.category] ?? 'border-[#1e3a5f] bg-[#0d1a2a] text-[#9ca3af]'}`}>
                        {rel.category}
                      </span>
                      <p className="flex-1 text-lg font-bold leading-snug text-white transition-colors group-hover:text-[#93c5fd]">
                        {rel.title}
                      </p>
                      <span className="mt-4 text-sm font-semibold text-[#818cf8] transition-colors group-hover:text-[#93c5fd]">Oku →</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
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
                <Link href="/" className="transition-colors hover:text-white">Ana Sayfa</Link>
                <Link href="/#paketler" className="transition-colors hover:text-white">Paketler</Link>
                <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
                <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
                <Link href="/blog/iptv-nedir" className="transition-colors hover:text-white">IPTV Nedir?</Link>
              </div>
              <p className="text-xs text-[#4b5563]">© {new Date().getFullYear()} GalyaStream. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
