// app/api/subscription/route.ts
// Kullanıcının aktif abonelik bilgisini döner
import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

async function rGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  const json = await res.json();
  return json.result ?? null;
}

// GET /api/subscription?email=xxx@xxx.com
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ success: false, error: 'email gerekli' }, { status: 400 });
  }

  try {
    const raw = await rGet(`subscription:${email}`);
    if (!raw) {
      return NextResponse.json({ success: false, error: 'Aktif abonelik bulunamadı.' }, { status: 404 });
    }

    const sub = JSON.parse(raw);
    const now = Date.now();

    // Süresi dolmuş mu?
    if (sub.expiresAt && sub.expiresAt < now) {
      return NextResponse.json({ success: false, error: 'Abonelik süresi dolmuş.' }, { status: 404 });
    }

    // Kalan gün hesapla
    const remainingMs   = sub.expiresAt ? sub.expiresAt - now : 0;
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      success: true,
      subscription: {
        plan:         sub.plan,
        durationDays: sub.durationDays,
        username:     sub.username || '',
        password:     sub.password || '',
        assignedAt:   sub.assignedAt,
        expiresAt:    sub.expiresAt,
        remainingDays,
        expiresFormatted: sub.expiresAt
          ? new Date(sub.expiresAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
          : '',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
