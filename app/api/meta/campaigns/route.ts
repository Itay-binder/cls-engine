import { NextResponse } from 'next/server';
import { getUserIntegrations } from '@/lib/user-integrations';

const BASE_URL = 'https://graph.facebook.com/v21.0';

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
}

interface MetaApiResponse {
  data?: MetaCampaign[];
  error?: { message: string; type: string; code: number };
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

  const fields = 'id,name,status,objective,daily_budget,lifetime_budget,start_time';
  const url = `${BASE_URL}/${adAccountId}/campaigns?fields=${fields}&access_token=${token}&limit=100`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const json = (await res.json()) as MetaApiResponse;
    if (json.error) {
      return NextResponse.json({ error: json.error.message, code: json.error.code }, { status: 502 });
    }
    return NextResponse.json(json.data ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to fetch campaigns: ${message}` }, { status: 502 });
  }
}
