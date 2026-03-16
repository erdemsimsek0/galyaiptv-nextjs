// app/api/xtream/route.ts
import { NextRequest, NextResponse } from 'next/server';

const XTREAM_SERVER = process.env.XTREAM_SERVER || 'http://pro4kiptv.xyz:2086';

export async function POST(req: NextRequest) {
  try {
    const { username, password, action, extra } = await req.json() as {
      username: string; password: string; action: string; extra?: Record<string, string>;
    };
    if (!username || !password || !action)
      return NextResponse.json({ error: 'username, password, action gerekli' }, { status: 400 });

    const params = new URLSearchParams({ username, password, action });
    if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    const url = `${XTREAM_SERVER}/player_api.php?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json, */*' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: res.status });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return NextResponse.json({ error: 'Parse hatası', sample: text.slice(0, 300) }, { status: 502 }); }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const s = new URL(req.url).searchParams;
  const u = s.get('u'), p = s.get('p'), action = s.get('action');
  if (!u || !p || !action)
    return NextResponse.json({ error: 'u, p, action gerekli' }, { status: 400 });

  const extra = Object.fromEntries([...s.entries()].filter(([k]) => !['u','p','action'].includes(k)));
  const params = new URLSearchParams({ username: u, password: p, action, ...extra });
  const url = `${XTREAM_SERVER}/player_api.php?${params.toString()}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json, */*' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: res.status });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return NextResponse.json({ error: 'Parse hatası', sample: text.slice(0, 300) }, { status: 502 }); }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
