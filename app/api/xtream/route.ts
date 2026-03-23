import { NextResponse } from 'next/server';

type XtreamAction = 'dashboard' | 'items';
type XtreamContentType = 'live' | 'vod' | 'series';

interface XtreamBody {
  action?: XtreamAction;
  serverUrl?: string;
  username?: string;
  password?: string;
  contentType?: XtreamContentType;
  categoryId?: string;
}

function normalizeServerUrl(serverUrl: string) {
  const trimmed = serverUrl.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error('Sunucu URL http:// veya https:// ile başlamalı.');
  }
  return trimmed;
}

async function fetchXtream(serverUrl: string, username: string, password: string, extraParams?: Record<string, string>) {
  const url = new URL(`${serverUrl}/player_api.php`);
  url.searchParams.set('username', username);
  url.searchParams.set('password', password);

  Object.entries(extraParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Xtream API isteği başarısız oldu (${res.status}).`);
  }
  return res.json();
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as XtreamBody;
    const serverUrl = normalizeServerUrl(body.serverUrl || '');
    const username = (body.username || '').trim();
    const password = (body.password || '').trim();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Kullanıcı adı ve şifre gerekli.' }, { status: 400 });
    }

    if (body.action === 'items') {
      const contentType = body.contentType;
      const categoryId = body.categoryId;

      if (!contentType || !categoryId) {
        return NextResponse.json({ success: false, error: 'İçerik tipi ve kategori gerekli.' }, { status: 400 });
      }

      const actionMap: Record<XtreamContentType, string> = {
        live: 'get_live_streams',
        vod: 'get_vod_streams',
        series: 'get_series',
      };

      const items = await fetchXtream(serverUrl, username, password, {
        action: actionMap[contentType],
        category_id: categoryId,
      });

      return NextResponse.json({ success: true, items: Array.isArray(items) ? items.slice(0, 100) : [] });
    }

    const [account, liveCategories, vodCategories, seriesCategories] = await Promise.all([
      fetchXtream(serverUrl, username, password),
      fetchXtream(serverUrl, username, password, { action: 'get_live_categories' }),
      fetchXtream(serverUrl, username, password, { action: 'get_vod_categories' }),
      fetchXtream(serverUrl, username, password, { action: 'get_series_categories' }),
    ]);

    if (!account?.user_info) {
      return NextResponse.json({ success: false, error: 'Xtream girişi başarısız. Bilgileri kontrol edin.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      dashboard: {
        account,
        liveCategories: Array.isArray(liveCategories) ? liveCategories : [],
        vodCategories: Array.isArray(vodCategories) ? vodCategories : [],
        seriesCategories: Array.isArray(seriesCategories) ? seriesCategories : [],
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Xtream API isteği tamamlanamadı.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
