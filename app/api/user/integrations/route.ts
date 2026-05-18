import { NextResponse } from 'next/server';
import { getUserIntegrations, saveUserIntegrations } from '@/lib/user-integrations';

// GET — load current user's integrations (keys masked for security)
export async function GET() {
  const result = await getUserIntegrations();
  if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { integrations } = result;

  // Mask keys before sending to client — only reveal whether they're set
  return NextResponse.json({
    anthropic_api_key_set: !!integrations.anthropic_api_key,
    anthropic_api_key_preview: integrations.anthropic_api_key
      ? `sk-ant-...${integrations.anthropic_api_key.slice(-6)}`
      : null,
    meta_access_token_set: !!integrations.meta_access_token,
    meta_access_token_preview: integrations.meta_access_token
      ? `...${integrations.meta_access_token.slice(-8)}`
      : null,
    meta_ad_account_id: integrations.meta_ad_account_id,
    meta_page_id: integrations.meta_page_id,
  });
}

// POST — save / update user's integrations
export async function POST(request: Request) {
  const result = await getUserIntegrations();
  if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, string | null>;
  try {
    body = await request.json() as Record<string, string | null>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only allow known fields
  const allowed = ['anthropic_api_key', 'meta_access_token', 'meta_ad_account_id', 'meta_page_id'];
  const filtered: Record<string, string | null> = {};
  for (const key of allowed) {
    if (key in body) {
      const val = body[key];
      // Empty string → treat as null (clear the key)
      filtered[key] = val === '' ? null : (val ?? null);
    }
  }

  const { error } = await saveUserIntegrations(result.workspaceId, filtered);
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ success: true });
}
