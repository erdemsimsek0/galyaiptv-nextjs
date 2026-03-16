// app/api/stream/route.ts — galyastream.com
//
// MİMARİ:
//   m3u8 manifest  → Vercel proxy (HTTP→HTTPS köprüsü)
//   .ts segmentler → Vercel proxy (?seg=) — mixed content çözümü
//   film/dizi      → Vercel proxy (range request destekli)
//
// VERCEL ENVIRONMENT VARIABLES:
//   XTREAM_SERVER = http://pro4kiptv.xyz:2086

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';

const SERVER = process.env.XTREAM_SERVER || 'http://pro4kiptv.xyz:2086';
const SERVER_HOST = new URL(SERVER).hostname;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// IPTV sunucusunun tanıyacağı header'lar
function iptvHeaders(refererPath = '') {
  return {
    'User-Agent': UA,
    'Accept': '*/*',
    'Accept-Encoding': 'identity',
    'Referer': `http://${SERVER_HOST}/${refererPath}`,
    'Origin': `http://${SERVER_HOST}`,
    'Connection': 'keep-alive',
  };
}

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
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get('origin')) });
}

export async function GET(req: NextRequest) {
  const s = new URL(req.url).searchParams;
  const origin = req.headers.get('origin');
  const CORS = getCorsHeaders(origin);

  // ── SEGMENT PROXY (?seg=URL) ─────────────────────────────────────────────────
  // Tarayıcı HTTPS'ten HTTP segment çekemez (mixed content).
  // Vercel sunucu tarafında HTTP'ye bağlanıp tarayıcıya HTTPS olarak döner.
  const seg = s.get('seg');
  if (seg) {
    try {
      const decoded = decodeURIComponent(seg);
      const res = await fetch(decoded, {
        headers: iptvHeaders('live/'),
        signal: AbortSignal.timeout(10_000),
      });

      // 512 gelirse farklı header kombinasyonu dene
      if (res.status === 512 || res.status === 403) {
        const res2 = await fetch(decoded, {
          headers: {
            'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
            'Accept': '*/*',
            'Connection': 'keep-alive',
          },
          signal: AbortSignal.timeout(10_000),
        });
        return new NextResponse(res2.body, {
          status: res2.ok ? 200 : res2.status,
          headers: {
            'Content-Type': res2.headers.get('content-type') || 'video/mp2t',
            'Cache-Control': 'no-cache, no-store',
            ...CORS,
          },
        });
      }

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
  const id = rawId ? rawId.split('&')[0] : null;

  if (!type || !u || !p || !id) {
    return new NextResponse('Eksik parametre', { status: 400, headers: CORS });
  }

  // ── CANLI YAYIN (?type=live) ─────────────────────────────────────────────────
  if (type === 'live') {
    const m3u8Url = `${SERVER}/live/${u}/${p}/${id}.m3u8`;

    try {
      const res = await fetch(m3u8Url, {
        headers: iptvHeaders(`live/${u}/${p}/`),
        signal: AbortSignal.timeout(12_000),
      });

      if (!res.ok) {
        return new NextResponse(
          `IPTV sunucu yanıtı: ${res.status}`,
          { status: res.status, headers: CORS }
        );
      }

      const text = await res.text();
      const baseUrl = `${SERVER}/live/${u}/${p}/`;

      // Segmentleri /api/stream?seg= üzerinden proxy'le (HTTPS köprüsü)
      const proxyBase = `/api/stream?seg=`;

      const rewritten = text.split('\n').map(line => {
        const t = line.trim();
        if (!t) return line;
        if (t.startsWith('#') && !t.includes('URI="')) return line;

        // Segment satırı
        if (!t.startsWith('#')) {
          const abs = t.startsWith('http') ? t : `${baseUrl}${t}`;
          return `${proxyBase}${encodeURIComponent(abs)}`;
        }

        // EXT-X-KEY
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
        isTimeout ? 'Sunucu 12sn yanıt vermedi.' : (e instanceof Error ? e.message : 'Hata'),
        { status: isTimeout ? 504 : 500, headers: CORS }
      );
    }
  }

  // ── FİLM / DİZİ ──────────────────────────────────────────────────────────────
  if (type === 'movie' || type === 'series') {
    const vodPath = type === 'movie' ? 'movie' : 'series';
    const vodUrl = `${SERVER}/${vodPath}/${u}/${p}/${id}.mp4`;

    try {
      const fetchHeaders: Record<string, string> = { 'User-Agent': UA, 'Accept': '*/*' };
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
