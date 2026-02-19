import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, getPostBySlug } from '@/lib/blog-posts';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `https://galyaiptv.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      url: `https://galyaiptv.com/blog/${post.slug}`,
    },
  };
}

function renderMarkdown(content: string): string {
  return content
    .trim()
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-gray-300 ml-4">• $1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="text-gray-300 ml-4">$1. $2</li>')
    .replace(/\n\n/g, '</p><p class="text-gray-300 leading-relaxed mb-4">')
    .replace(/^(.+)$(?!\n)/gm, (line) =>
      line.startsWith('<') ? line : `<p class="text-gray-300 leading-relaxed mb-4">${line}</p>`
    );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'Galya IPTV' },
    publisher: {
      '@type': 'Organization',
      name: 'Galya IPTV',
      logo: { '@type': 'ImageObject', url: 'https://galyaiptv.com/logo.png' },
    },
    url: `https://galyaiptv.com/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Galya IPTV
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-300">
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/#paketler" className="hover:text-white transition-colors">Paketler</Link>
          </div>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-4">
          <Link href="/blog" className="text-purple-400 hover:text-purple-300 text-sm">
            ← Blog&apos;a Dön
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded">
            {post.category}
          </span>
          <time className="text-gray-500 text-xs">{post.date}</time>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">{post.title}</h1>

        <article
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        <div className="mt-12 bg-purple-900/20 border border-purple-700 rounded-xl p-6 text-center">
          <h3 className="font-bold text-xl mb-2">Galya IPTV&apos;yi Ücretsiz Deneyin!</h3>
          <p className="text-gray-400 text-sm mb-4">
            24 saatlik ücretsiz test ile hizmetimizi kendiniz keşfedin.
          </p>
          <a
            href="https://wa.me/447445508352?text=Merhaba,%20IPTV%20test%20almak%20istiyorum"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            💬 WhatsApp ile Test Al
          </a>
        </div>
      </main>

      <footer className="border-t border-gray-800 py-8 px-4 text-center text-gray-500 text-sm mt-8">
        <p>© {new Date().getFullYear()} Galya IPTV. Tüm hakları saklıdır.</p>
      </footer>
    </>
  );
}
