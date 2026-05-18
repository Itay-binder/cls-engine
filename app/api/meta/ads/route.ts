import { NextResponse } from 'next/server';

const BASE_URL = 'https://graph.facebook.com/v21.0';

// ─── Meta API raw types ────────────────────────────────────────────────────────

interface MetaCreative {
  id: string;
  name?: string;
  thumbnail_url?: string;
  image_url?: string;
  video_id?: string;
}

interface MetaAd {
  id: string;
  name: string;
  status: string;
  creative?: MetaCreative;
}

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaInsightRow {
  ad_id: string;
  ad_name: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  spend?: string;
  actions?: MetaAction[];
  purchase_roas?: Array<{ action_type: string; value: string }>;
}

interface MetaAdsApiResponse {
  data?: MetaAd[];
  error?: { message: string; type: string; code: number };
  paging?: { next?: string };
}

interface MetaInsightsApiResponse {
  data?: MetaInsightRow[];
  error?: { message: string; type: string; code: number };
  paging?: { next?: string };
}

// ─── Normalized output type ────────────────────────────────────────────────────

export interface NormalizedAd {
  id: string;
  name: string;
  status: string;
  thumbnail_url: string | null;
  creative_type: 'video' | 'image' | 'unknown';
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  conversions: number;
  roas: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNum(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function extractConversions(actions?: MetaAction[]): number {
  if (!actions) return 0;
  const purchase = actions.find((a) => a.action_type === 'purchase');
  if (purchase) return parseNum(purchase.value);
  const lead = actions.find((a) => a.action_type === 'lead');
  if (lead) return parseNum(lead.value);
  return 0;
}

function extractRoas(purchase_roas?: MetaInsightRow['purchase_roas']): number {
  if (!purchase_roas || purchase_roas.length === 0) return 0;
  const omni = purchase_roas.find((r) => r.action_type === 'omni_purchase');
  return parseNum(omni?.value ?? purchase_roas[0]?.value);
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !adAccountId) {
    return NextResponse.json(
      { error: 'META_ACCESS_TOKEN or META_AD_ACCOUNT_ID not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') ?? '50';

  // ── 1. Fetch ads list with creative fields ─────────────────────────────────
  const adFields = 'id,name,status,creative{id,name,thumbnail_url,image_url,video_id}';
  const adsUrl = `${BASE_URL}/${adAccountId}/ads?fields=${adFields}&limit=${limit}&access_token=${token}`;

  let adsData: MetaAd[] = [];
  try {
    const res = await fetch(adsUrl, { cache: 'no-store' });
    const json = (await res.json()) as MetaAdsApiResponse;

    if (json.error) {
      return NextResponse.json(
        { error: json.error.message, code: json.error.code },
        { status: 502 }
      );
    }
    adsData = json.data ?? [];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch ads: ${message}` }, { status: 502 });
  }

  // ── 2. Fetch insights for all ads (account level, broken out by ad) ────────
  const insightFields =
    'ad_id,ad_name,impressions,clicks,ctr,cpc,cpm,spend,actions,purchase_roas';
  const insightsUrl =
    `${BASE_URL}/${adAccountId}/insights` +
    `?fields=${insightFields}` +
    `&date_preset=last_30d` +
    `&level=ad` +
    `&limit=${limit}` +
    `&access_token=${token}`;

  const insightsMap = new Map<string, MetaInsightRow>();
  try {
    const res = await fetch(insightsUrl, { cache: 'no-store' });
    const json = (await res.json()) as MetaInsightsApiResponse;

    if (json.error) {
      // Insights failure is non-fatal — we'll merge with zeros
      console.error('[meta/ads] insights error:', json.error.message);
    } else {
      for (const row of json.data ?? []) {
        insightsMap.set(row.ad_id, row);
      }
    }
  } catch (err) {
    console.error('[meta/ads] failed to fetch insights:', err);
  }

  // ── 3. Merge ───────────────────────────────────────────────────────────────
  const normalized: NormalizedAd[] = adsData.map((ad) => {
    const insight = insightsMap.get(ad.id);
    const creative = ad.creative;

    const thumbnailUrl =
      creative?.thumbnail_url ?? creative?.image_url ?? null;

    const creativeType: NormalizedAd['creative_type'] = creative?.video_id
      ? 'video'
      : creative?.image_url || creative?.thumbnail_url
      ? 'image'
      : 'unknown';

    return {
      id: ad.id,
      name: ad.name,
      status: ad.status,
      thumbnail_url: thumbnailUrl,
      creative_type: creativeType,
      impressions: parseNum(insight?.impressions),
      clicks: parseNum(insight?.clicks),
      ctr: parseNum(insight?.ctr),
      cpc: parseNum(insight?.cpc),
      cpm: parseNum(insight?.cpm),
      spend: parseNum(insight?.spend),
      conversions: extractConversions(insight?.actions),
      roas: extractRoas(insight?.purchase_roas),
    };
  });

  return NextResponse.json(normalized);
}
