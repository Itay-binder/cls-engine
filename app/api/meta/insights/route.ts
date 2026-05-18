import { NextResponse } from 'next/server';
import { getUserIntegrations } from '@/lib/user-integrations';

const BASE_URL = 'https://graph.facebook.com/v21.0';

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaInsightsRow {
  impressions?: string;
  clicks?: string;
  spend?: string;
  ctr?: string;
  cpc?: string;
  actions?: MetaAction[];
  purchase_roas?: Array<{ action_type: string; value: string }>;
  account_name?: string;
  account_id?: string;
}

interface MetaInsightsResponse {
  data?: MetaInsightsRow[];
  error?: { message: string; type: string; code: number };
}

export interface InsightsSummary {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  purchases: number;
  leads: number;
  roas: number;
  account_name: string;
  account_id: string;
}

export async function GET() {
  const userResult = await getUserIntegrations();
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { meta_access_token: token, meta_ad_account_id: adAccountId } = userResult.integrations;
  if (!token || !adAccountId) {
    return NextResponse.json(
      { error: 'Meta credentials not configured. Add them in Settings → Integrations.' },
      { status: 503 }
    );
  }

  const fields = 'impressions,clicks,spend,ctr,cpc,actions,purchase_roas,account_name,account_id';
  const url = `${BASE_URL}/${adAccountId}/insights?fields=${fields}&date_preset=last_30d&access_token=${token}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const json = (await res.json()) as MetaInsightsResponse;

    if (json.error) {
      return NextResponse.json({ error: json.error.message, code: json.error.code }, { status: 502 });
    }

    const row = json.data?.[0];
    if (!row) return NextResponse.json({ error: 'No insights data returned' }, { status: 502 });

    const purchases = row.actions?.find((a) => a.action_type === 'purchase')?.value ?? '0';
    const leads = row.actions?.find((a) => a.action_type === 'lead')?.value ?? '0';
    const roasVal =
      row.purchase_roas?.find((r) => r.action_type === 'omni_purchase')?.value ??
      row.purchase_roas?.[0]?.value ?? '0';

    const summary: InsightsSummary = {
      impressions: parseInt(row.impressions ?? '0', 10),
      clicks: parseInt(row.clicks ?? '0', 10),
      spend: parseFloat(row.spend ?? '0'),
      ctr: parseFloat(row.ctr ?? '0'),
      cpc: parseFloat(row.cpc ?? '0'),
      purchases: parseFloat(purchases),
      leads: parseFloat(leads),
      roas: parseFloat(roasVal),
      account_name: row.account_name ?? '',
      account_id: row.account_id ?? adAccountId,
    };

    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch insights: ${message}` }, { status: 502 });
  }
}
