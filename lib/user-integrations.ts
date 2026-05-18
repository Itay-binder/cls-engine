import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getOrCreateWorkspace } from '@/lib/workspace';

export interface UserIntegrations {
  anthropic_api_key: string | null;
  meta_access_token: string | null;
  meta_ad_account_id: string | null;
  meta_page_id: string | null;
}

/**
 * Get the authenticated user's integration keys.
 * Falls back to env vars if the user hasn't set their own keys.
 * Returns null if not authenticated.
 */
export async function getUserIntegrations(): Promise<{
  integrations: UserIntegrations;
  workspaceId: string;
  userId: string;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const workspaceId = await getOrCreateWorkspace(supabase, user.id);

  const { data } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  return {
    workspaceId,
    userId: user.id,
    integrations: {
      anthropic_api_key: data?.anthropic_api_key || process.env.ANTHROPIC_API_KEY || null,
      meta_access_token: data?.meta_access_token || process.env.META_ACCESS_TOKEN || null,
      meta_ad_account_id: data?.meta_ad_account_id || process.env.META_AD_ACCOUNT_ID || null,
      meta_page_id: data?.meta_page_id || process.env.META_PAGE_ID || null,
    },
  };
}

/**
 * Save (upsert) integration keys for the current user's workspace.
 * Uses service role key to bypass RLS (safe — caller is authenticated above).
 */
export async function saveUserIntegrations(
  workspaceId: string,
  data: Partial<UserIntegrations>
): Promise<{ error: string | null }> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await admin
    .from('user_integrations')
    .upsert(
      { workspace_id: workspaceId, ...data, updated_at: new Date().toISOString() },
      { onConflict: 'workspace_id' }
    );

  return { error: error?.message ?? null };
}
