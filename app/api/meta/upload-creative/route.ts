import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://graph.facebook.com/v21.0';

// LiftyGo page ID — update if using a different page
const META_PAGE_ID = process.env.META_PAGE_ID ?? ''; // e.g. "105...", set in .env.local

interface UploadCreativeBody {
  creative_asset_id: string;
  title: string;
  caption: string;
  ad_set_id?: string;
}

interface MetaCreativeResponse {
  id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export async function POST(request: Request) {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !adAccountId) {
    return NextResponse.json(
      { error: 'META_ACCESS_TOKEN or META_AD_ACCOUNT_ID not configured' },
      { status: 500 }
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
    return NextResponse.json(
      { error: 'creative_asset_id and title are required' },
      { status: 400 }
    );
  }

  if (!META_PAGE_ID) {
    return NextResponse.json(
      {
        error:
          'META_PAGE_ID is not configured. Set it in .env.local to the Facebook Page ID ' +
          'for your ad account (e.g. the LiftyGo page ID). ' +
          'You can find it in Meta Business Suite → Pages → About.',
      },
      { status: 500 }
    );
  }

  // ── 1. Create ad creative via Meta Graph API ─────────────────────────────────
  const createUrl = `${BASE_URL}/${adAccountId}/adcreatives`;

  const metaPayload = {
    name: title,
    object_story_spec: {
      page_id: META_PAGE_ID,
      link_data: {
        message: caption,
        link: 'https://cls-engine.vercel.app',
      },
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
      return NextResponse.json(
        { error: json.error.message, code: json.error.code },
        { status: 502 }
      );
    }

    if (!json.id) {
      return NextResponse.json(
        { error: 'Meta API returned no creative ID' },
        { status: 502 }
      );
    }

    metaCreativeId = json.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create Meta creative: ${message}` },
      { status: 502 }
    );
  }

  // ── 2. Update creative_assets row: status = 'published', meta_creative_id ───
  try {
    const supabase = await createClient();

    const { error: dbError } = await supabase
      .from('creative_assets')
      .update({
        status: 'published',
        meta_creative_id: metaCreativeId,
      })
      .eq('id', creative_asset_id);

    if (dbError) {
      // Non-fatal — creative was created in Meta, just log
      console.warn('[upload-creative] Supabase update failed:', dbError.message);
    }
  } catch (err) {
    console.warn('[upload-creative] Supabase error:', err);
  }

  return NextResponse.json({
    success: true,
    meta_creative_id: metaCreativeId,
    message: 'Creative uploaded to Meta successfully.',
  });
}
