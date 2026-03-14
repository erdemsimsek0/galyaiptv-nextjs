/**
 * Basit Markdown → HTML dönüştürücü
 * JSX içermez — .ts olarak güvenle kullanılabilir.
 * Tam MDX pipeline kuruluysa bu dosyayı kaldırıp doğrudan MDX kullanın.
 */

const H3_CLASS  = 'mt-6 mb-2 text-lg font-bold text-white';
const H2_CLASS  = 'mt-8 mb-3 text-xl font-bold text-white';
const H1_CLASS  = 'mt-0 mb-4 text-2xl font-bold text-white';
const STRONG_CLASS = 'font-semibold text-white';
const LI_CLASS  = 'flex items-start gap-2 text-sm text-[#9b98b0]';
const DOT_CLASS = 'mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7c6fcd]';
const OLI_CLASS = 'text-sm text-[#9b98b0] list-decimal ml-5';
const TD_CLASS  = 'px-3 py-2 text-sm text-[#9b98b0]';
const TR_CLASS  = 'border-b border-white/[0.08]';
const P_CLASS   = 'leading-relaxed text-[#9b98b0]';
const A_CLASS   = 'text-[#7c6fcd] underline underline-offset-2 hover:text-white transition-colors';

function tag(el: string, cls: string, content: string): string {
  return '<' + el + ' class="' + cls + '">' + content + '</' + el + '>';
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];

  for (const raw of lines) {
    const line = raw;

    // H3
    if (line.startsWith('### ')) {
      out.push(tag('h3', H3_CLASS, line.slice(4)));
      continue;
    }
    // H2
    if (line.startsWith('## ')) {
      out.push(tag('h2', H2_CLASS, line.slice(3)));
      continue;
    }
    // H1
    if (line.startsWith('# ')) {
      out.push(tag('h1', H1_CLASS, line.slice(2)));
      continue;
    }

    // Tablo ayraç satırı → atla
    if (/^\|[\s\-:|]+\|$/.test(line)) continue;

    // Tablo veri satırı
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter(Boolean).map((c) => c.trim());
      const tds = cells.map((c) => tag('td', TD_CLASS, inlineFormat(c))).join('');
      out.push(tag('tr', TR_CLASS, tds));
      continue;
    }

    // Numaralı liste
    if (/^\d+\.\s/.test(line)) {
      out.push(tag('li', OLI_CLASS, inlineFormat(line.replace(/^\d+\.\s/, ''))));
      continue;
    }

    // Madde imi liste
    if (/^[-*]\s/.test(line)) {
      const dot = '<span class="' + DOT_CLASS + '"></span>';
      out.push('<li class="' + LI_CLASS + '">' + dot + inlineFormat(line.slice(2)) + '</li>');
      continue;
    }

    // Boş satır
    if (line.trim() === '') {
      out.push('');
      continue;
    }

    // Normal paragraf
    out.push(tag('p', P_CLASS, inlineFormat(line)));
  }

  return out.join('\n');
}

/** Satır içi biçimlendirme: bold, link */
function inlineFormat(s: string): string {
  return s
    // Bold
    .replace(/\*\*(.+?)\*\*/g, tag('strong', STRONG_CLASS, '$1'))
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-xs text-[#f1f0f5]">$1</code>')
    // Link
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="' + A_CLASS + '">$1</a>',
    );
}
