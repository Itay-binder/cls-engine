import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const META_APP_ID = process.env.META_APP_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const STATE_SECRET = process.env.META_OAUTH_STATE_SECRET;

function buildState(userId: string): string {
  const payload = { uid: userId, exp: Date.now() + 15 * 60 * 1000 };
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString('base64url');
}

export async function GET() {
  if (!META_APP_ID || !APP_URL || !STATE_SECRET) {
    return NextResponse.json(
      { error: 'Meta OAuth not configured. Set META_APP_ID, NEXT_PUBLIC_APP_URL, META_OAUTH_STATE_SECRET.' },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const state = buildState(user.id);
  const redirectUri = encodeURIComponent(`${APP_URL}/api/meta/callback`);
  const scope = 'ads_read,ads_management,business_management,pages_read_engagement';

  const url =
    `https://www.facebook.com/v22.0/dialog/oauth` +
    `?client_id=${META_APP_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scope}` +
    `&state=${state}` +
    `&response_type=code`;

  return NextResponse.redirect(url);
}
