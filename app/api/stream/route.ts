// app/api/stream/route.ts
// Canlı yayın, film ve dizi stream'lerini proxy'ler (Mixed Content sorunu için)

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';

const SERVER = process.env.XTREAM_SERVER || 'http://pro4kiptv.xyz:2086';

export async function GET(req: NextRequest) {
  const s = new URL(req.url).searchParams;
  const type = s.get('type'); // live | movie | series
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

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
    });

    if (!res.ok) {
      return new NextResponse(`Stream hatası: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'video/mp2t';
    
    // Stream'i direkt geçir
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: unknown) {
    return new NextResponse(e instanceof Error ? e.message : 'Hata', { status: 500 });
  }
}
