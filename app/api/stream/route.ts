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

// Farklı User-Agent'lar — sunucu hangisini kabul ederse
const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'VLC/3.0.20 LibVLC/3.0.20',
  'Lavf/58.76.100',
  'stagefright/1.2 (Linux;Android 14)',
  'okhttp/4.9.0',
];

// IPTV sunucusunun tanıyacağı header kombinasyonları — sırayla denenir
function buildHeaderSets(refererPath = ''): Record<string, string>[] {
  return [
    // 1. Tarayıcı benzeri
    {
      'User-Agent': UA_LIST[0],
      'Accept': '*/*',
      'Referer': `http://${SERVER_HOST}/${refererPath}`,
      'Origin': `http://${SERVER_HOST}`,
    },
    // 2. VLC
    {
      'User-Agent': UA_LIST[1],
      'Accept': '*/*',
      'Icy-MetaData': '1',
    },
    // 3. FFmpeg/Lavf
    {
      'User-Agent': UA_LIST[2],
      'Accept': '*/*',
    },
    // 4. Android player
    {
      'User-Agent': UA_LIST[3],
      'Accept': '*/*',
    },
    // 5. Minimal
    {
      'User-Agent': UA_LIST[4],
    },
  ];
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

// Segment veya m3u8 için çoklu header denemesi
async function fetchWithFallback(
  url: string,
  refererPath = '',
  timeoutMs = 10_000
): Promise<Response> {
  const headerSets = buildHeaderSets(refererPath);
  let lastError: unknown;

  for (const headers of headerSets) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
        // @ts-ignore — Node.js fetch: redirect takibi
        redirect: 'follow',
      });

      // 200-299 veya 206 (partial) kabul et
      if (res.ok || res.status === 206) return res;

      // 512 / 403 / 401 → sonraki header setini dene
      if (res.status === 512 || res.status === 403 || res.status === 401) {
        // Body'yi tüket, bağlantıyı serbest bırak
        await res.body?.cancel();
        continue;
      }

      // Diğer hatalar (404, 502 vb.) → direkt dön
      return res;
    } catch (e) {
      lastError = e;
      // Timeout veya network hatası → sonraki dene
    }
  }

  // Tüm denemeler başarısız
  throw lastError ?? new Error('Tüm header kombinasyonları başarısız');
}

export async function GET(req: NextRequest) {
  const s = new URL(req.url).searchParams;
  const origin = req.headers.get('origin');
  const CORS = getCorsHeaders(origin);

  // ── SEGMENT PROXY (?seg=URL) ─────────────────────────────────────────────────
  const seg = s.get('seg');
  if (seg) {
    try {
      const decoded = decodeURIComponent(seg);

      // URL güvenlik kontrolü — sadece beklenen sunucuya istek at
      const segUrl = new URL(decoded);
      if (segUrl.hostname !== SERVER_HOST) {
        return new NextResponse('Geçersiz segment kaynağı', { status: 400, headers: CORS });
      }

      const res = await fetchWithFallback(decoded, 'live/', 12_000);

      return new NextResponse(res.body, {
        status: res.ok ? 200 : res.status,
        headers: {
          'Content-Type': res.headers.get('content-type') || 'video/mp2t',
          'Cache-Control': 'no-cache, no-store',
          ...CORS,
        },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Segment hatası';
      const isTimeout = e instanceof Error && e.name === 'TimeoutError';
      return new NextResponse(msg, { status: isTimeout ? 504 : 502, headers: CORS });
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
      const res = await fetchWithFallback(m3u8Url, `live/${u}/${p}/`, 15_000);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return new NextResponse(
          `IPTV sunucu yanıtı: ${res.status}${body ? ' — ' + body.slice(0, 200) : ''}`,
          { status: res.status, headers: CORS }
        );
      }

      const text = await res.text();
      const baseUrl = `${SERVER}/live/${u}/${p}/`;
      const proxyBase = `/api/stream?seg=`;

      const rewritten = text.split('\n').map(line => {
        const t = line.trim();
        if (!t) return line;
        if (t.startsWith('#') && !t.includes('URI="')) return line;

        if (!t.startsWith('#')) {
          const abs = t.startsWith('http') ? t : `${baseUrl}${t}`;
          return `${proxyBase}${encodeURIComponent(abs)}`;
        }

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
        isTimeout ? 'Sunucu 15sn yanıt vermedi.' : (e instanceof Error ? e.message : 'Hata'),
        { status: isTimeout ? 504 : 500, headers: CORS }
      );
    }
  }

  // ── FİLM / DİZİ ──────────────────────────────────────────────────────────────
  if (type === 'movie' || type === 'series') {
    const vodPath = type === 'movie' ? 'movie' : 'series';
    const vodUrl = `${SERVER}/${vodPath}/${u}/${p}/${id}.mp4`;

    try {
      const fetchHeaders: Record<string, string> = {
        'User-Agent': UA_LIST[0],
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
