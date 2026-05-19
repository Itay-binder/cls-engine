import { NextRequest, NextResponse } from 'next/server';

const META_APP_ID = '1086098950156180';

interface LongLivedTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message: string; type: string; code: number };
}

// POST /api/meta/exchange-token
// Upgrades a short-lived implicit-flow token to a 60-day long-lived user token.
// Called by /oauth/meta page immediately after receiving the hash token from Facebook.
export async function POST(req: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: 'META_APP_SECRET not configured' }, { status: 503 });
  }

  const body = (await req.json()) as { token?: string };
  if (!body.token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  const url =
    `https://graph.facebook.com/v22.0/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${META_APP_ID}` +
    `&client_secret=${appSecret}` +
    `&fb_exchange_token=${encodeURIComponent(body.token)}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const json = (await res.json()) as LongLivedTokenResponse;

    if (json.error) {
      return NextResponse.json({ error: json.error.message }, { status: 400 });
    }

    return NextResponse.json({
      access_token: json.access_token,
      expires_in: json.expires_in,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
