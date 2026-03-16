// app/api/stream/route.ts — galyastream.com
//
// MİMARİ:
//   m3u8 manifest  → Vercel /api/stream?type=live        küçük metin, <1sn
//   .ts segmentler → CF Worker ?url=<encoded>            IPTV live IP engeli aşmak için
//   film/dizi      → Vercel /api/stream?type=movie/series range request destekli
//
// NOT: IPTV sunucusu live segmentleri için Vercel IP'sini engelliyor (512 dönüyor).
// Bu yüzden segmentler CF Worker üzerinden proxy'leniyor.
//
// VERCEL ENVIRONMENT VARIABLES:
//   XTREAM_SERVER  = http://pro4kiptv.xyz:2086
//   CF_WORKER_URL  = https://galyastream-proxy.erdemsimsek06.workers.dev

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';

const SERVER = process.env.XTREAM_SERVER || 'http://pro4kiptv.xyz:2086';

// CF Worker URL — Vercel env variable olarak set et
// Segmentler Vercel üzerinden 512 aldığı için CF Worker üzerinden gönderiyoruz
const CF_WORKER = process.env.CF_WORKER_URL || '';

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = [
    'https://www.galyastream.com',
    'https://galyastream.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];
  const allowedOrigin = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
    'Vary': 'Origin',
  };
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const s = new URL(req.url).searchParams;
  const origin = req.headers.get('origin');
  const CORS = getCorsHeaders(origin);

  const seg = s.get('seg'); // Vercel fallback segment proxy (CF_WORKER yoksa)

  // ── SEGMENT PROXY FALLBACK (?seg=URL) ────────────────────────────────────────
  // CF_WORKER_URL set edilmemişse buraya düşer (geliştirme ortamı için)
  if (seg) {
    try {
      const decoded = decodeURIComponent(seg);
      const res = await fetch(decoded, {
        headers: { 'User-Agent': UA, 'Accept': '*/*' },
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
  const rawId = s.get('id');
  const id = rawId ? rawId.split('&')[0] : null; // &ext=m3u8 gibi artıkları temizle

  if (!type || !u || !p || !id) {
    return new NextResponse('Eksik parametre: type, u, p, id gerekli', { status: 400, headers: CORS });
  }

  // ── CANLI YAYIN (?type=live) ─────────────────────────────────────────────────
  if (type === 'live') {
    const m3u8Url = `${SERVER}/live/${u}/${p}/${id}.m3u8`;

    try {
      const res = await fetch(m3u8Url, {
        headers: { 'User-Agent': UA, 'Accept': '*/*' },
        signal: AbortSignal.timeout(12_000),
      });

      if (!res.ok) {
        // .ts uzantısıyla tekrar dene
        const tsUrl = `${SERVER}/live/${u}/${p}/${id}.ts`;
        const tsRes = await fetch(tsUrl, {
          headers: { 'User-Agent': UA, 'Accept': '*/*' },
          signal: AbortSignal.timeout(8_000),
        }).catch(() => null);

        if (tsRes && tsRes.ok) {
          return new NextResponse(tsRes.body, {
            status: 200,
            headers: {
              'Content-Type': 'video/mp2t',
              'Cache-Control': 'no-cache, no-store, max-age=0',
              ...CORS,
            },
          });
        }

        return new NextResponse(
          `IPTV sunucu yanıtı: ${res.status} — kanal aktif olmayabilir`,
          { status: res.status, headers: CORS }
        );
      }

      const text = await res.text();
      const baseUrl = `${SERVER}/live/${u}/${p}/`;

      // ✅ KRİTİK: Segmentler CF Worker üzerinden gönderiliyor
      // CF_WORKER_URL set edilmişse → CF Worker, yoksa → Vercel fallback
      const proxyBase = CF_WORKER
        ? `${CF_WORKER}?url=`
        : `/api/stream?seg=`;

      // m3u8 içindeki segment URL'lerini proxy'e yönlendir
      const rewritten = text.split('\n').map(line => {
        const t = line.trim();

        if (!t) return line;
        if (t.startsWith('#') && !t.includes('URI="')) return line;

        // Segment satırı (.ts / .aac / .mp4 / .fmp4)
        if (/\.(ts|aac|mp4|fmp4)(\?|$)/i.test(t)) {
          const abs = t.startsWith('http') ? t : `${baseUrl}${t}`;
          return `${proxyBase}${encodeURIComponent(abs)}`;
        }

        // Uzantısız relative segment
        if (!t.startsWith('#') && !t.startsWith('http') && t.length > 0) {
          const abs = `${baseUrl}${t}`;
          return `${proxyBase}${encodeURIComponent(abs)}`;
        }

        // Absolute segment (uzantısız)
        if (!t.startsWith('#') && t.startsWith('http')) {
          return `${proxyBase}${encodeURIComponent(t)}`;
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
          ? 'IPTV sunucusu 12 saniyede yanıt vermedi. Kanal aktif olmayabilir.'
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
        'User-Agent': UA,
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

  return new NextResponse('Geçersiz tip. Beklenen: live | movie | series', { status: 400, headers: CORS });
}
