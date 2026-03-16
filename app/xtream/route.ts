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

    // Sunucu HTTP only — https:// gelirse http:// ye çevir
    const finalUrl = decoded.replace('https://', 'http://');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let res: Response;
    try {
      res = await fetch(finalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json, */*',
          'Connection': 'keep-alive',
        },
        signal: controller.signal,
        // @ts-ignore — Node.js fetch HTTP desteği
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream: ${res.status} ${res.statusText}` }, { status: res.status });
    }

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'JSON parse hatası', sample: text.slice(0, 200) }, { status: 502 });
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
