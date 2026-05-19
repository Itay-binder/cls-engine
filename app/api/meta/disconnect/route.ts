import { NextResponse } from 'next/server';
import { getUserIntegrations, saveUserIntegrations } from '@/lib/user-integrations';

export async function POST() {
  const result = await getUserIntegrations();
  if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await saveUserIntegrations(result.workspaceId, {
    meta_access_token: null,
    meta_ad_account_id: null,
    meta_page_id: null,
  });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ success: true });
}
