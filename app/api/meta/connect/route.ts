import { NextResponse } from 'next/server';

// App ID is public — no secret needed for implicit flow
const META_APP_ID = '2188933491882801';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cls-engine.vercel.app';

// GET /api/meta/connect
// Kicks off Facebook OAuth (implicit flow — response_type=token).
// No App Secret required. Token is returned in the URL fragment on the callback page.
export async function GET() {
  const redirectUri = encodeURIComponent(`${APP_URL}/oauth/meta`);
  const scope = 'ads_read';

  const url =
    `https://www.facebook.com/v22.0/dialog/oauth` +
    `?client_id=${META_APP_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}` +
    `&response_type=token`;

  return NextResponse.redirect(url);
}
