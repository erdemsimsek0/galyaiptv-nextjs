// app/api/stream/route.ts
// HTTP IPTV stream'lerini HTTPS üzerinden proxy'ler
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

  if (!type || !u || !p || !id) {
    return new NextResponse('Eksik parametre', { status: 400 });
  }

  let url = '';
  if (type === 'live')   url = `${SERVER}/live/${u}/${p}/${id}.${ext}`;
  if (type === 'movie')  url = `${SERVER}/movie/${u}/${p}/${id}.mp4`;
  if (type === 'series') url = `${SERVER}/series/${u}/${p}/${id}.mp4`;

  if (!url) return new NextResponse('Geçersiz tip', { status: 400 });

  try {
    // Range header'ı ilet (ileri/geri sarma için)
    const rangeHeader = req.headers.get('range');
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Connection': 'keep-alive',
    };
    if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

    const res = await fetch(url, { headers: fetchHeaders });

    if (!res.ok && res.status !== 206) {
      return new NextResponse(`Stream hatası: ${res.status}`, { status: res.status });
    }

    const resHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    };

    // Orijinal header'ları geçir
    const ct = res.headers.get('content-type');
    const cl = res.headers.get('content-length');
    const cr = res.headers.get('content-range');
    const ac = res.headers.get('accept-ranges');

    if (ct) resHeaders['Content-Type'] = ct;
    else if (type === 'live') resHeaders['Content-Type'] = ext === 'm3u8' ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
    else resHeaders['Content-Type'] = 'video/mp4';

    if (cl) resHeaders['Content-Length'] = cl;
    if (cr) resHeaders['Content-Range'] = cr;
    if (ac) resHeaders['Accept-Ranges'] = ac;
    else resHeaders['Accept-Ranges'] = 'bytes';

    return new NextResponse(res.body, {
      status: rangeHeader ? 206 : res.status,
      headers: resHeaders,
    });

  } catch (e: unknown) {
    return new NextResponse(
      e instanceof Error ? e.message : 'Stream hatası',
      { status: 500 }
    );
  }
}
