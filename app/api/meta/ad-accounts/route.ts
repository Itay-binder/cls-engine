import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://graph.facebook.com/v21.0';

interface AdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
}

interface GraphResponse {
  data?: AdAccount[];
  error?: { message: string; code: number };
}

// GET /api/meta/ad-accounts?token=EAANx...
// Lists all ad accounts accessible with the given token.
// Does NOT require the user to be logged in — used during setup wizard
// before credentials are saved.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  const fields = 'id,name,account_status,currency';
  const url = `${BASE}/me/adaccounts?fields=${fields}&access_token=${encodeURIComponent(token)}&limit=50`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const json = (await res.json()) as GraphResponse;

    if (json.error) {
      return NextResponse.json(
        { error: json.error.message, code: json.error.code },
        { status: 400 }
      );
    }

    const accounts = (json.data ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      status: a.account_status === 1 ? 'active' : 'inactive',
      currency: a.currency,
    }));

    return NextResponse.json({ accounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
