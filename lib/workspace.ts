import { SupabaseClient } from '@supabase/supabase-js';

export async function getOrCreateWorkspace(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .single();

  if (data) return data.id;

  const { data: created } = await supabase
    .from('workspaces')
    .insert({ owner_id: userId, name: 'My Workspace', slug: `workspace-${userId.slice(0, 8)}` })
    .select('id')
    .single();

  return created!.id;
}
