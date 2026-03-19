import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;

async function redis(command: unknown[]): Promise<unknown> {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  const data = await res.json();
  if (data.error) throw new Error(`Redis error: ${data.error}`);
  return data.result;
}

async function redisKeys(pattern: string): Promise<string[]> {
  return (await redis(['KEYS', pattern])) as string[];
}

async function redisGet(key: string): Promise<string | null> {
  return (await redis(['GET', key])) as string | null;
}

async function redisSet(key: string, value: string, ttl?: number) {
  const command = ttl ? ['SET', key, value, 'EX', ttl] : ['SET', key, value];
  await redis(command);
}

function isAdmin(req: NextRequest) {
  return req.headers.get('x-admin-secret') === ADMIN_SECRET;
}

function formatDate(ts?: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
}

function parseMaybeJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    const [subscriptionKeys, trialKeys, paymentKeys, supportKeys, reminderKeys] = await Promise.all([
      redisKeys('subscription:*'),
      redisKeys('trial:email:*'),
      redisKeys('payment:notification:*'),
      redisKeys('support:ticket:*'),
      redisKeys('renewal:reminder:*'),
    ]);

    const customerMap = new Map<string, { email: string; subscription?: Record<string, unknown>; timeline: Array<Record<string, unknown>>; lastReminderAt?: number; }>();

    const ensureCustomer = (email: string) => {
      const current = customerMap.get(email) ?? { email, timeline: [] };
      customerMap.set(email, current);
      return current;
    };

    for (const key of subscriptionKeys) {
      const item = parseMaybeJson<Record<string, unknown>>(await redisGet(key));
      if (!item?.email) continue;
      const email = String(item.email);
      const customer = ensureCustomer(email);
      customer.subscription = item;
      customer.timeline.push({ type: 'subscription', createdAt: item.assignedAt ?? item.expiresAt ?? Date.now(), title: 'Abonelik aktif', detail: `${item.plan ?? 'Paket'} · ${item.durationDays ?? 0} gün`, status: 'success' });
      if (item.expiresAt) {
        const expiresAt = Number(item.expiresAt);
        const remainingDays = Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000));
        customer.timeline.push({ type: 'renewal_due', createdAt: expiresAt, title: 'Yenileme tarihi', detail: `${remainingDays} gün kaldı`, status: remainingDays <= 3 ? 'warning' : 'neutral' });
      }
    }

    for (const key of trialKeys) {
      const item = parseMaybeJson<Record<string, unknown>>(await redisGet(key));
      if (!item?.email) continue;
      const email = String(item.email);
      ensureCustomer(email).timeline.push({
        type: 'trial',
        createdAt: item.createdAt ?? Date.now(),
        title: 'Test hesabı oluşturuldu',
        detail: `${item.selectedPackage ?? 'Paket'} · ${item.username ?? ''}`.trim(),
        status: 'neutral',
      });
    }

    for (const key of paymentKeys) {
      const item = parseMaybeJson<Record<string, unknown>>(await redisGet(key));
      if (!item?.email) continue;
      const email = String(item.email);
      ensureCustomer(email).timeline.push({
        type: 'payment',
        createdAt: item.createdAt ?? Date.now(),
        title: 'Ödeme bildirimi',
        detail: `${item.plan ?? ''} · ₺${item.amount ?? ''}`.trim(),
        status: item.status ?? 'pending',
      });
    }

    for (const key of supportKeys) {
      const item = parseMaybeJson<Record<string, unknown>>(await redisGet(key));
      if (!item?.email) continue;
      const email = String(item.email);
      ensureCustomer(email).timeline.push({
        type: 'ticket',
        createdAt: item.createdAt ?? Date.now(),
        title: 'Destek talebi',
        detail: `${item.issue ?? 'Destek'}${item.note ? ` · ${item.note}` : ''}`,
        status: item.status ?? 'open',
      });
    }

    for (const key of reminderKeys) {
      const item = parseMaybeJson<Record<string, unknown>>(await redisGet(key));
      if (!item?.email) continue;
      const email = String(item.email);
      const reminderAt = Number(item.sentAt ?? Date.now());
      const customer = ensureCustomer(email);
      customer.lastReminderAt = reminderAt;
      customer.timeline.push({
        type: 'reminder',
        createdAt: reminderAt,
        title: 'Yenileme hatırlatması gönderildi',
        detail: String(item.channel ?? 'manual'),
        status: 'success',
      });
    }

    const customers = Array.from(customerMap.values())
      .map((customer) => {
        const sortedTimeline = customer.timeline.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
        const expiresAt = Number(customer.subscription?.expiresAt ?? 0);
        const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000)) : null;
        return {
          email: customer.email,
          plan: customer.subscription?.plan ?? null,
          expiresAt,
          expiresFormatted: formatDate(expiresAt),
          daysLeft,
          username: customer.subscription?.username ?? '',
          password: customer.subscription?.password ?? '',
          lastReminderAt: customer.lastReminderAt ?? null,
          lastReminderFormatted: formatDate(customer.lastReminderAt),
          openTickets: sortedTimeline.filter((event) => event.type === 'ticket' && event.status === 'open').length,
          timeline: sortedTimeline.map((event) => ({ ...event, createdAtFormatted: formatDate(Number(event.createdAt)) })),
        };
      })
      .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));

    return NextResponse.json({ success: true, customers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    const { action, email, channel = 'admin-panel', note = '' } = await req.json() as { action?: string; email?: string; channel?: string; note?: string };
    if (action !== 'send_renewal_reminder' || !email) {
      return NextResponse.json({ success: false, error: 'Geçersiz istek.' }, { status: 400 });
    }

    const payload = {
      email,
      channel,
      note,
      sentAt: Date.now(),
    };

    await redisSet(`renewal:reminder:${email}`, JSON.stringify(payload), 90 * 24 * 3600);
    return NextResponse.json({ success: true, reminder: { ...payload, sentAtFormatted: formatDate(payload.sentAt) } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
