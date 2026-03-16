// app/api/stream/route.ts — galyastream.com
//
// MİMARİ:
//   m3u8 manifest  →  bu Vercel route  (küçük metin, <1sn, timeout yok)
//   .ts segmentler →  Cloudflare Worker (HTTPS→HTTP köprüsü, timeout yok)
//
// VERCEL ENVIRONMENT VARIABLES (vercel.com → galyastream projesi → Settings → Env Vars):
//   XTREAM_SERVER         = http://pro4kiptv.xyz:2086        (sunucu adresi)
//   NEXT_PUBLIC_CF_WORKER = https://galyastream-proxy.SENIN_ADINIZ.workers.dev

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15; // m3u8 okumak için 15sn fazlasıyla yeter

import { NextRequest, NextResponse } from 'next/server';

const SERVER      = process.env.XTREAM_SERVER          || 'http://pro4kiptv.xyz:2086';
const CF_WORKER   = process.env.NEXT_PUBLIC_CF_WORKER  || '';

const ALLOWED_ORIGIN = 'https://www.galyastream.com';

const CORS = {
  'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Vary': 'Origin',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const s    = new URL(req.url).searchParams;
  const type = s.get('type');
  const u    = s.get('u');
  const p    = s.get('p');
  const id   = s.get('id');

  if (!type || !u || !p || !id) {
    return new NextResponse('Eksik parametre', { status: 400, headers: CORS });
  }

  // ── CANLI YAYIN ─────────────────────────────────────────────────────────────
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

      const text    = await res.text();
      const baseUrl = `${SERVER}/live/${u}/${p}/`;

      // m3u8 içindeki relative segment URL'lerini absolute yap,
      // ardından Cloudflare Worker üzerinden geçir (HTTPS→HTTP köprüsü).
      const rewritten = text.split('\n').map(line => {
        const t = line.trim();

        // Boş satır veya saf yorum
        if (!t || (t.startsWith('#') && !t.includes('URI="'))) return line;

        // Segment satırı
        if (/\.(ts|aac|mp4|fmp4)(\?|$)/i.test(t)) {
          const abs = t.startsWith('http') ? t : baseUrl + t;
          return CF_WORKER ? `${CF_WORKER}?url=${encodeURIComponent(abs)}` : abs;
        }

        // EXT-X-KEY şifre anahtarı
        if (t.includes('URI="')) {
          return t.replace(/URI="([^"]+)"/, (_: string, uri: string) => {
            const abs = uri.startsWith('http') ? uri : baseUrl + uri;
            return `URI="${CF_WORKER ? `${CF_WORKER}?url=${encodeURIComponent(abs)}` : abs}"`;
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

  // ── FİLM / DİZİ ─────────────────────────────────────────────────────────────
  if (type === 'movie' || type === 'series') {
    const vodPath = type === 'movie' ? 'movie' : 'series';
    const vodUrl  = `${SERVER}/${vodPath}/${u}/${p}/${id}.mp4`;

    try {
      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      };
      const range = req.headers.get('range');
      if (range) fetchHeaders['Range'] = range;

      const res = await fetch(vodUrl, { headers: fetchHeaders });

      const resHeaders: Record<string, string> = {
        'Content-Type':   res.headers.get('content-type')   || 'video/mp4',
        'Accept-Ranges':  'bytes',
        'Cache-Control':  'no-cache',
        ...CORS,
      };
      const cl = res.headers.get('content-length');
      const cr = res.headers.get('content-range');
      if (cl) resHeaders['Content-Length'] = cl;
      if (cr) resHeaders['Content-Range']  = cr;

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
