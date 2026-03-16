// app/api/stream/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

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

  // HTTP URL'e direkt redirect et - tarayıcı Mixed Content engelini
  // bazı durumlarda aşar, en azından film/dizi için çalışır
  return NextResponse.redirect(url, { status: 302 });
}
