import { NextResponse } from 'next/server';

const BASE_URL = 'https://graph.facebook.com/v21.0';

interface MetaAdSet {
  id: string;
  name: string;
  status: string;
}

interface MetaApiResponse {
  data?: MetaAdSet[];
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export async function GET(request: Request) {
  const token = process.env.META_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'META_ACCESS_TOKEN not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaign_id');

  if (!campaignId) {
    return NextResponse.json(
      { error: 'campaign_id query param is required' },
      { status: 400 }
    );
  }

  const fields = 'id,name,status';
  const url = `${BASE_URL}/${campaignId}/adsets?fields=${fields}&access_token=${token}&limit=100`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const json = (await res.json()) as MetaApiResponse;

    if (json.error) {
      return NextResponse.json(
        { error: json.error.message, code: json.error.code },
        { status: 502 }
      );
    }

    return NextResponse.json(json.data ?? []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch ad sets: ${message}` },
      { status: 502 }
    );
  }
}
