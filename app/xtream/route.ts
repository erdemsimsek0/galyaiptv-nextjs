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

    // Vercel HTTP→HTTPS: http:// URL'lerini https:// olarak dene
    // Sunucu HTTPS desteklemiyorsa http:// ile dene
    const urls = decoded.startsWith('http://')
      ? [decoded.replace('http://', 'https://'), decoded]
      : [decoded];

    let lastError = '';
    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json, */*',
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          lastError = `HTTP ${res.status}`;
          continue;
        }

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          // Bazen XML veya HTML dönebilir — ham metin döndür
          return new NextResponse(text, {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          });
        }

        return NextResponse.json(data, {
          headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
        });
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        continue;
      }
    }

    return NextResponse.json(
      { error: `Sunucuya ulaşılamadı: ${lastError}` },
      { status: 502 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Proxy hatası';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
