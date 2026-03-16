// app/api/stream/route.ts — galyastream.com
//
// MİMARİ: Her şey Vercel üzerinden — Cloudflare'e gerek yok.
//   m3u8 manifest  → bu route (?type=live)         küçük metin, <1sn
//   .ts segmentler → bu route (?seg=URL)            ~200KB, hızlı biter, timeout yok
//   film/dizi      → bu route (?type=movie/series)  range request destekli
//
// Vercel IP'si IPTV sunucusu tarafından engellenmemiş (film/dizi zaten çalışıyor).
// Cloudflare IP'si engellendiği için CF Worker yerine Vercel proxy kullanıyoruz.
//
// VERCEL ENVIRONMENT VARIABLES:
//   XTREAM_SERVER = http://pro4kiptv.xyz:2086

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';

const SERVER = process.env.XTREAM_SERVER || 'http://pro4kiptv.xyz:2086';

const CORS = {
  'Access-Control-Allow-Origin': 'https://www.galyastream.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Vary': 'Origin',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const s = new URL(req.url).searchParams;
  const seg = s.get('seg'); // segment proxy modu

  // ── SEGMENT PROXY (?seg=URL) ─────────────────────────────────────────────────
  // m3u8 içindeki .ts segmentlerini Vercel üzerinden proxy'le.
  // Her segment ~200KB, çok hızlı biter — Vercel 30sn limitine takılmaz.
  if (seg) {
    try {
      const decoded = decodeURIComponent(seg);

      const res = await fetch(decoded, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
        },
        signal: AbortSignal.timeout(10_000),
      });

      return new NextResponse(res.body, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('content-type') || 'video/mp2t',
          'Cache-Control': 'no-cache, no-store',
          ...CORS,
        },
      });
    } catch (e: unknown) {
      return new NextResponse(
        e instanceof Error ? e.message : 'Segment hatası',
        { status: 502, headers: CORS }
      );
    }
  }

  const type = s.get('type');
  const u = s.get('u');
  const p = s.get('p');
  const id = s.get('id');

  if (!type || !u || !p || !id) {
    return new NextResponse('Eksik parametre', { status: 400, headers: CORS });
  }

  // ── CANLI YAYIN (?type=live) ─────────────────────────────────────────────────
  if (type === 'live') {
    const m3u8Url = `${SERVER}/live/${u}/${p}/${id}.m3u8`;

    try {
      const res = await fetch(m3u8Url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        return new NextResponse(
          `IPTV sunucu yanıtı: ${res.status} — kanal aktif olmayabilir`,
          { status: res.status, headers: CORS }
        );
      }

      const text = await res.text();
      const baseUrl = `${SERVER}/live/${u}/${p}/`;
      // Segment proxy base URL — aynı Vercel route'u ?seg= parametresiyle
      const proxyBase = `/api/stream?seg=`;

      // m3u8 içindeki segment URL'lerini Vercel proxy'e yönlendir
      const rewritten = text.split('\n').map(line => {
        const t = line.trim();

        // Boş satır veya saf yorum
        if (!t || (t.startsWith('#') && !t.includes('URI="'))) return line;

        // Segment satırı (.ts / .aac / .mp4 / .fmp4)
        if (/\.(ts|aac|mp4|fmp4)(\?|$)/i.test(t)) {
          const abs = t.startsWith('http') ? t : `${baseUrl}${t}`;
          return `${proxyBase}${encodeURIComponent(abs)}`;
        }

        // EXT-X-KEY şifre anahtarı
        if (t.includes('URI="')) {
          return t.replace(/URI="([^"]+)"/, (_: string, uri: string) => {
            const abs = uri.startsWith('http') ? uri : `${baseUrl}${uri}`;
            return `URI="${proxyBase}${encodeURIComponent(abs)}"`;
          });
        }

        return line;
      }).join('\n');

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache, no-store, max-age=0',
          ...CORS,
        },
      });

    } catch (e: unknown) {
      const isTimeout = e instanceof Error && e.name === 'TimeoutError';
      return new NextResponse(
        isTimeout
          ? 'IPTV sunucusu 10 saniyede yanıt vermedi. Kanal aktif olmayabilir.'
          : (e instanceof Error ? e.message : 'Bilinmeyen hata'),
        { status: isTimeout ? 504 : 500, headers: CORS }
      );
    }
  }

  // ── FİLM / DİZİ (?type=movie veya ?type=series) ──────────────────────────────
  if (type === 'movie' || type === 'series') {
    const vodPath = type === 'movie' ? 'movie' : 'series';
    const vodUrl = `${SERVER}/${vodPath}/${u}/${p}/${id}.mp4`;

    try {
      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      };
      const range = req.headers.get('range');
      if (range) fetchHeaders['Range'] = range;

      const res = await fetch(vodUrl, { headers: fetchHeaders });

      const resHeaders: Record<string, string> = {
        'Content-Type': res.headers.get('content-type') || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
        ...CORS,
      };
      const cl = res.headers.get('content-length');
      const cr = res.headers.get('content-range');
      if (cl) resHeaders['Content-Length'] = cl;
      if (cr) resHeaders['Content-Range'] = cr;

      return new NextResponse(res.body, { status: res.status, headers: resHeaders });

    } catch (e: unknown) {
      return new NextResponse(
        e instanceof Error ? e.message : 'VOD hatası',
        { status: 500, headers: CORS }
      );
    }
  }

  return new NextResponse('Geçersiz tip', { status: 400, headers: CORS });
}
