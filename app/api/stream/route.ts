// app/api/stream/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';

const SERVER = process.env.XTREAM_SERVER || 'http://pro4kiptv.xyz:2086';

export async function GET(req: NextRequest) {
  const s = new URL(req.url).searchParams;
  const type = s.get('type');
  const u = s.get('u');
  const p = s.get('p');
  const id = s.get('id');
  const ext = s.get('ext') || 'ts';
  const segUrl = s.get('seg'); // segment proxy modu

  // Segment proxy modu - m3u8 içindeki .ts segmentlerini proxy'le
  if (segUrl) {
    try {
      const decoded = decodeURIComponent(segUrl);
      const res = await fetch(decoded, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
      });
      return new NextResponse(res.body, {
        status: res.status,
        headers: {
          'Content-Type': 'video/mp2t',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (e: unknown) {
      return new NextResponse('Segment hatası', { status: 500 });
    }
  }

  if (!type || !u || !p || !id) {
    return new NextResponse('Eksik parametre', { status: 400 });
  }

  let url = '';
  if (type === 'live')   url = `${SERVER}/live/${u}/${p}/${id}.${ext}`;
  if (type === 'movie')  url = `${SERVER}/movie/${u}/${p}/${id}.mp4`;
  if (type === 'series') url = `${SERVER}/series/${u}/${p}/${id}.mp4`;

  if (!url) return new NextResponse('Geçersiz tip', { status: 400 });

  try {
    const rangeHeader = req.headers.get('range');
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
    };
    if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

    const res = await fetch(url, { headers: fetchHeaders });

    // m3u8 ise içeriği parse edip segment URL'lerini proxy'e yönlendir
    if (ext === 'm3u8' || (res.headers.get('content-type') || '').includes('mpegurl')) {
      const text = await res.text();
      const baseUrl = `${SERVER}/live/${u}/${p}/`;
      const proxyBase = `/api/stream?seg=`;

      // Her .ts satırını proxy URL'e çevir
      const rewritten = text.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.endsWith('.ts') || trimmed.endsWith('.aac') || trimmed.endsWith('.mp4')) {
          const fullUrl = trimmed.startsWith('http') ? trimmed : `${baseUrl}${trimmed}`;
          return `${proxyBase}${encodeURIComponent(fullUrl)}`;
        }
        // URI= içeren satırlar
        if (trimmed.includes('URI="') && !trimmed.startsWith('#EXTINF')) {
          return trimmed.replace(/URI="([^"]+)"/, (_, uri) => {
            const fullUri = uri.startsWith('http') ? uri : `${baseUrl}${uri}`;
            return `URI="${proxyBase}${encodeURIComponent(fullUri)}"`;
          });
        }
        return line;
      }).join('\n');

      return new NextResponse(rewritten, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Film/dizi - direkt pipe
    const resHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
      'Accept-Ranges': 'bytes',
    };

    const ct = res.headers.get('content-type');
    const cl = res.headers.get('content-length');
    const cr = res.headers.get('content-range');

    if (ct) resHeaders['Content-Type'] = ct;
    else resHeaders['Content-Type'] = 'video/mp4';
    if (cl) resHeaders['Content-Length'] = cl;
    if (cr) resHeaders['Content-Range'] = cr;

    return new NextResponse(res.body, { status: res.status, headers: resHeaders });

  } catch (e: unknown) {
    return new NextResponse(
      e instanceof Error ? e.message : 'Stream hatası',
      { status: 500 }
    );
  }
}
