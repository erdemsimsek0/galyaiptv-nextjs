// app/api/payments/route.ts
// Ödeme bildirimleri ve kullanıcı abonelik yönetimi
import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL    = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN  = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;

async function rGet(key: string): Promise<string | null> {
  const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }, cache: 'no-store',
  });
  const json = await res.json();
  return json.result ?? null;
}

async function rSet(key: string, value: string, ttl?: number) {
  const url = ttl
    ? `${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${ttl}`
    : `${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
  await fetch(url, { headers: { Authorization: `Bearer ${REDIS_TOKEN}` }, cache: 'no-store' });
}

async function rDel(key: string) {
  await fetch(`${REDIS_URL}/del/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
}

async function rKeys(pattern: string): Promise<string[]> {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['KEYS', pattern]),
  });
  const json = await res.json();
  return json.result ?? [];
}

// ─── GET: Admin — ödeme bildirimlerini listele ────────────────────────────────
export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    const keys = await rKeys('payment:notification:*');
    const notifications = [];

    for (const key of keys) {
      const val = await rGet(key);
      if (!val) continue;
      notifications.push(JSON.parse(val));
    }

    notifications.sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ success: true, notifications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Hata';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ─── POST: Kullanıcı ödeme bildirimi VEYA admin abonelik tanımlama ─────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isAdmin = req.headers.get('x-admin-secret') === ADMIN_SECRET;

    // ── Admin: kullanıcıya abonelik tanımla ──────────────────────────────────
    if (isAdmin && body.action === 'assign_subscription') {
      const { email, plan, durationDays, username, password } = body;
      if (!email || !plan || !durationDays) {
        return NextResponse.json({ success: false, error: 'email, plan, durationDays gerekli' }, { status: 400 });
      }

      const ttl = durationDays * 24 * 60 * 60;
      const subscription = {
        email,
        plan,
        durationDays,
        username: username || '',
        password: password || '',
        assignedAt: Date.now(),
        expiresAt: Date.now() + (ttl * 1000),
        assignedBy: 'admin',
      };

      await rSet(`subscription:${email}`, JSON.stringify(subscription), ttl);

      // Eğer username/password verilmişse trial record'ı da güncelle
      if (username && password) {
        const existingTrial = await rGet(`trial:email:${email}`);
        const trialData = existingTrial ? JSON.parse(existingTrial) : { email, ip: 'admin-assigned', createdAt: Date.now() };
        trialData.username = username;
        trialData.password = password;
        trialData.selectedPackage = plan;
        trialData.subscriptionPlan = plan;
        trialData.subscriptionDays = durationDays;
        await rSet(`trial:email:${email}`, JSON.stringify(trialData), ttl);
      }

      // Bildirimi güncelle — ödendi olarak işaretle
      const notifKey = `payment:notification:${email}`;
      const notif = await rGet(notifKey);
      if (notif) {
        const n = JSON.parse(notif);
        n.status = 'approved';
        n.approvedAt = Date.now();
        n.assignedPlan = plan;
        await rSet(notifKey, JSON.stringify(n), 30 * 24 * 3600);
      }

      return NextResponse.json({ success: true, message: `${email} için ${plan} - ${durationDays} günlük abonelik tanımlandı.` });
    }

    // ── Admin: bildirimi reddet / sil ────────────────────────────────────────
    if (isAdmin && body.action === 'reject_notification') {
      const { email } = body;
      if (!email) return NextResponse.json({ success: false, error: 'email gerekli' }, { status: 400 });
      const notifKey = `payment:notification:${email}`;
      const notif = await rGet(notifKey);
      if (notif) {
        const n = JSON.parse(notif);
        n.status = 'rejected';
        n.rejectedAt = Date.now();
        await rSet(notifKey, JSON.stringify(n), 7 * 24 * 3600);
      }
      return NextResponse.json({ success: true, message: 'Bildirim reddedildi.' });
    }

    // ── Kullanıcı: ödeme bildirimi yap ──────────────────────────────────────
    const { email, plan, amount, paymentCode } = body;
    if (!email || !plan) {
      return NextResponse.json({ success: false, error: 'email ve plan gerekli' }, { status: 400 });
    }

    const notification = {
      email,
      plan,
      amount: amount || '',
      paymentCode: paymentCode || '',
      status: 'pending',
      createdAt: Date.now(),
      createdAtFormatted: new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
    };

    await rSet(`payment:notification:${email}`, JSON.stringify(notification), 7 * 24 * 3600);
    return NextResponse.json({ success: true, message: 'Ödeme bildirimi alındı. En kısa sürede aktif edilecektir.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Hata';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
