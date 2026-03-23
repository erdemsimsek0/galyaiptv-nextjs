import { NextResponse } from 'next/server';

import { loadPanelLineState, savePanelLineState } from '@/lib/panel-automation';

interface RequestBody {
  action?: 'load' | 'save';
  username?: string;
  inChannels?: string[];
  notInChannels?: string[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as RequestBody;
    const username = (body.username || '').trim();

    if (!username) {
      return NextResponse.json({ success: false, error: 'Kullanıcı adı gerekli.' }, { status: 400 });
    }

    if (body.action === 'save') {
      const result = await savePanelLineState(username, {
        inChannels: body.inChannels || [],
        notInChannels: body.notInChannels || [],
      });
      return NextResponse.json({ success: true, lines: result });
    }

    const result = await loadPanelLineState(username);
    return NextResponse.json({ success: true, lines: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Panel line işlemi tamamlanamadı.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
