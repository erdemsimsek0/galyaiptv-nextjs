// app/api/xtream/route.ts
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_SERVER = 'pro4kiptv.xyz';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'url parametresi gerekli' }, { status: 400 });
    }

    const decoded = decodeURIComponent(targetUrl);

    if (!decoded.includes(ALLOWED_SERVER)) {
      return NextResponse.json({ error: 'Yetkisiz sunucu' }, { status: 403 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(decoded, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream: ${res.status}` }, { status: res.status });
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Geçersiz yanıt', raw: text.slice(0, 200) }, { status: 502 });
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Proxy hatası';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
