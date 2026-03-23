import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { runPanelAutomation, type PanelAutomationAction } from '@/lib/panel-automation';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

async function rGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: 'no-store',
  });
  const json = await res.json();
  return json.result ?? null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ success: false, error: 'Oturum bulunamadı.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { action?: PanelAutomationAction };
  const action = body.action === 'refresh' ? 'refresh' : 'inspect';

  try {
    const rawSubscription = await rGet(`subscription:${email}`);
    if (!rawSubscription) {
      return NextResponse.json({ success: false, error: 'Önce aktif abonelik gerekiyor.' }, { status: 404 });
    }

    const subscription = JSON.parse(rawSubscription) as { username?: string };
    const result = await runPanelAutomation({
      action,
      target: {
        email,
        username: subscription.username,
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Panel otomasyonu çalıştırılamadı.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
