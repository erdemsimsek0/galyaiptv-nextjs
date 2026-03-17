// app/api/payment-notification-status/route.ts
// Kullanıcının ödeme bildirimi durumunu döner (pending / approved / rejected)
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

// GET /api/payment-notification-status?email=xxx@xxx.com
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ success: false, error: 'email gerekli' }, { status: 400 });
  }

  try {
    const raw = await rGet(`payment:notification:${email}`);
    if (!raw) {
      return NextResponse.json({ success: false, error: 'Bildirim bulunamadı.' }, { status: 404 });
    }

    const notif = JSON.parse(raw);
    return NextResponse.json({
      success: true,
      status: notif.status ?? 'pending',   // pending | approved | rejected
      createdAt: notif.createdAt,
      plan: notif.plan,
      amount: notif.amount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
