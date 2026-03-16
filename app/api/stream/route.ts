// app/api/stream/route.ts — galyastream.com
//
// MİMARİ:
//   m3u8 manifest  → Vercel /api/stream?type=live  (Vercel HTTP ile IPTV'ye bağlanır)
//   .ts segmentler → Tarayıcı direkt IPTV'ye bağlanır (kullanıcının kendi IP'si)
//   film/dizi      → Vercel /api/stream?type=movie/series
//
// NOT: Mixed content sorunu yok çünkü manifest içindeki segment URL'leri
// http:// olarak döndürülüyor ve HLS.js bunları direkt fetch ediyor.
// Tarayıcı mixed content'i video/audio için bloklamaz (sadece script/style için).
//
// VERCEL ENVIRONMENT VARIABLES:
//   XTREAM_SERVER = http://pro4kiptv.xyz:2086

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';

const SERVER = process.env.XTREAM_SERVER || 'http://pro4kiptv.xyz:2086';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const s = new URL(req.url).searchParams;
  const origin = req.headers.get('origin');
  const CORS = getCorsHeaders(origin);

  const type = s.get('type');
  const u = s.get('u');
  const p = s.get('p');
  const rawId = s.get('id');
  const id = rawId ? rawId.split('&')[0] : null;

  if (!type || !u || !p || !id) {
    return new NextResponse('Eksik parametre: type, u, p, id gerekli', { status: 400, headers: CORS });
  }

  // ── CANLI YAYIN (?type=live) ─────────────────────────────────────────────────
  // Vercel sunucu tarafında HTTP ile manifest'i çeker, tarayıcıya döndürür.
  // Segment URL'leri absolute http:// olarak döndürülür.
  // Tarayıcı (HLS.js) segmentleri kendi IP'siyle direkt IPTV'den çeker.
  // Bu sayede mixed content sorunu olmaz ve datacenter IP engeli aşılır.
  if (type === 'live') {
    const m3u8Url = `${SERVER}/live/${u}/${p}/${id}.m3u8`;

    try {
      const res = await fetch(m3u8Url, {
        headers: { 'User-Agent': UA, 'Accept': '*/*' },
        signal: AbortSignal.timeout(12_000),
      });

      if (!res.ok) {
        return new NextResponse(
          `IPTV sunucu yanıtı: ${res.status} — kanal aktif olmayabilir`,
          { status: res.status, headers: CORS }
        );
      }

      const text = await res.text();
      const baseUrl = `${SERVER}/live/${u}/${p}/`;

      // Segment URL'lerini absolute http:// yap — proxy yok, direkt IPTV
      const rewritten = text.split('\n').map(line => {
        const t = line.trim();

        if (!t) return line;
        if (t.startsWith('#') && !t.includes('URI="')) return line;

        // Relative segment → absolute http://
        if (!t.startsWith('#') && !t.startsWith('http')) {
          return `${baseUrl}${t}`;
        }

        // EXT-X-KEY URI → absolute
        if (t.includes('URI="')) {
          return t.replace(/URI="([^"]+)"/, (_: string, uri: string) => {
            const abs = uri.startsWith('http') ? uri : `${baseUrl}${uri}`;
            return `URI="${abs}"`;
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
