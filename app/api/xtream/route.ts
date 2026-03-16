// app/api/xtream/route.ts
// Node.js runtime kullan - Vercel'in farklı IP havuzundan çıkar

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';

const XTREAM_SERVER = process.env.XTREAM_SERVER || 'http://pro4kiptv.xyz:2086';

async function proxyRequest(params: URLSearchParams) {
  const url = `${XTREAM_SERVER}/player_api.php?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, */*',
      'Accept-Language': 'tr-TR,tr;q=0.9',
      'Connection': 'keep-alive',
    },
    // @ts-ignore - Node.js fetch'te cache kontrolü
    cache: 'no-store',
  });

  return res;
}

export async function POST(req: NextRequest) {
  try {
    const { username, password, action, extra } = await req.json();

    if (!username || !password || !action) {
      return NextResponse.json({ error: 'username, password, action gerekli' }, { status: 400 });
    }

    const params = new URLSearchParams({ username, password, action });
    if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, String(v)));

    const res = await proxyRequest(params);

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream HTTP ${res.status}` }, { status: res.status });
    }

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return NextResponse.json({ error: 'Parse hatası', sample: text.slice(0, 300) }, { status: 502 }); }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60' }
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const s = new URL(req.url).searchParams;
    const u = s.get('u'), p = s.get('p'), action = s.get('action');

    if (!u || !p || !action) {
      return NextResponse.json({ error: 'u, p, action gerekli' }, { status: 400 });
    }

    const extra = Object.fromEntries([...s.entries()].filter(([k]) => !['u', 'p', 'action'].includes(k)));
    const params = new URLSearchParams({ username: u, password: p, action, ...extra });

    const res = await proxyRequest(params);

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream HTTP ${res.status}` }, { status: res.status });
    }

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return NextResponse.json({ error: 'Parse hatası', sample: text.slice(0, 300) }, { status: 502 }); }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60' }
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
