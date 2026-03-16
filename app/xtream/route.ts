// app/api/xtream/route.ts
// Xtream Codes API proxy — tarayıcıdan direkt erişimde CORS hatası olur
// Bu route sunucu tarafından proxy eder

import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_SERVER = 'pro4kiptv.xyz';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'url parametresi gerekli' }, { status: 400 });
    }

    // Güvenlik: sadece kendi sunucumuza proxy yap
    if (!targetUrl.includes(ALLOWED_SERVER)) {
      return NextResponse.json({ error: 'Yetkisiz sunucu' }, { status: 403 });
    }

    const res = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IPTV Client)' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Proxy hatası';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
