// app/api/xtream/route.ts
import { NextRequest, NextResponse } from 'next/server';

const CF_WORKER_URL = process.env.CF_WORKER_URL || 'https://iptv-proxy.erdemsimsek06.workers.dev';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(CF_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('abort') || msg.includes('signal')) {
      return NextResponse.json({ error: 'Zaman aşımı. Lütfen tekrar deneyin.' }, { status: 504 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const s = new URL(req.url).searchParams;
    const workerUrl = new URL(CF_WORKER_URL);
    s.forEach((v, k) => workerUrl.searchParams.set(k, v));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(workerUrl.toString(), {
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('abort') || msg.includes('signal')) {
      return NextResponse.json({ error: 'Zaman aşımı. Lütfen tekrar deneyin.' }, { status: 504 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
