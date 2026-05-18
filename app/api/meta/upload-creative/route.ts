import { NextResponse } from 'next/server';
import { getUserIntegrations, saveUserIntegrations } from '@/lib/user-integrations';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const BASE_URL = 'https://graph.facebook.com/v21.0';

interface UploadCreativeBody {
  creative_asset_id: string;
  title: string;
  caption: string;
  ad_set_id?: string;
}

interface MetaCreativeResponse {
  id?: string;
  error?: { message: string; type: string; code: number };
}

export async function POST(request: Request) {
  const userResult = await getUserIntegrations();
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { meta_access_token: token, meta_ad_account_id: adAccountId, meta_page_id: pageId } =
    userResult.integrations;

  if (!token || !adAccountId) {
    return NextResponse.json(
      { error: 'Meta credentials not configured. Add them in Settings → Integrations.' },
      { status: 503 }
    );
  }

  if (!pageId) {
    return NextResponse.json(
      { error: 'Meta Page ID not configured. Add it in Settings → Integrations.' },
      { status: 503 }
    );
  }

  let body: UploadCreativeBody;
  try {
    body = (await request.json()) as UploadCreativeBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { creative_asset_id, title, caption } = body;
  if (!creative_asset_id || !title) {
    return NextResponse.json({ error: 'creative_asset_id and title are required' }, { status: 400 });
  }

  // Create ad creative via Meta Graph API
  const createUrl = `${BASE_URL}/${adAccountId}/adcreatives`;
  const metaPayload = {
    name: title,
    object_story_spec: {
      page_id: pageId,
      link_data: { message: caption, link: 'https://cls-engine.vercel.app' },
    },
    access_token: token,
  };

  let metaCreativeId: string;
  try {
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaPayload),
    });
    const json = (await res.json()) as MetaCreativeResponse;
    if (json.error) {
      return NextResponse.json({ error: json.error.message, code: json.error.code }, { status: 502 });
    }
    if (!json.id) {
      return NextResponse.json({ error: 'Meta API returned no creative ID' }, { status: 502 });
    }
    metaCreativeId = json.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to create Meta creative: ${message}` }, { status: 502 });
  }

  // Update creative_assets in DB
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await admin
      .from('creative_assets')
      .update({ status: 'published', meta_creative_id: metaCreativeId })
      .eq('id', creative_asset_id);
  } catch {
    // non-fatal
  }

  return NextResponse.json({ success: true, meta_creative_id: metaCreativeId });
}
