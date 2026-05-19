import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveUserIntegrations, getUserIntegrations } from '@/lib/user-integrations';

const META_APP_ID = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

interface TokenResponse {
  access_token?: string;
  error?: { message: string };
}

async function exchangeCode(code: string): Promise<string> {
  const redirectUri = encodeURIComponent(`${APP_URL}/api/meta/callback`);
  const shortRes = await fetch(
    `https://graph.facebook.com/v22.0/oauth/access_token` +
    `?client_id=${META_APP_ID}` +
    `&client_secret=${META_APP_SECRET}` +
    `&redirect_uri=${redirectUri}` +
    `&code=${code}`
  );
  const short = (await shortRes.json()) as TokenResponse;
  if (!short.access_token) throw new Error(short.error?.message ?? 'Token exchange failed');

  const longRes = await fetch(
    `https://graph.facebook.com/v22.0/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${META_APP_ID}` +
    `&client_secret=${META_APP_SECRET}` +
    `&fb_exchange_token=${short.access_token}`
  );
  const long = (await longRes.json()) as TokenResponse;
  if (!long.access_token) throw new Error(long.error?.message ?? 'Long-lived token exchange failed');

  return long.access_token;
}

function verifyState(state: string, expectedUid: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(state, 'base64url').toString());
    if (payload.uid !== expectedUid) return false;
    if (payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const settingsUrl = `${APP_URL}/settings?tab=integrations`;

  if (error || !code || !state) {
    return NextResponse.redirect(`${settingsUrl}&meta_error=${encodeURIComponent(error ?? 'Missing params')}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${APP_URL}/login`);

  if (!verifyState(state, user.id)) {
    return NextResponse.redirect(`${settingsUrl}&meta_error=Invalid+state`);
  }

  try {
    const accessToken = await exchangeCode(code);
    const intResult = await getUserIntegrations();
    if (!intResult) return NextResponse.redirect(`${APP_URL}/login`);

    const { error: saveError } = await saveUserIntegrations(intResult.workspaceId, {
      meta_access_token: accessToken,
    });

    if (saveError) {
      return NextResponse.redirect(`${settingsUrl}&meta_error=${encodeURIComponent(saveError)}`);
    }

    return NextResponse.redirect(`${settingsUrl}&meta_connected=1`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.redirect(`${settingsUrl}&meta_error=${encodeURIComponent(msg)}`);
  }
}
