import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getOrCreateWorkspace } from '@/lib/workspace';

interface SaveBriefBody {
  title: string;
  hook: string;
  script: string;
  caption: string;
  visual_prompt: string;
  production_notes: string;
  avatar_name: string;
  angle_name: string;
  concept: string;
  format?: string;
  platform?: string;
}

export async function POST(request: Request) {
  // Authenticate user via SSR client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SaveBriefBody;
  try {
    body = await request.json() as SaveBriefBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Get workspace
  const workspaceId = await getOrCreateWorkspace(supabase, user.id);

  // Use service role to bypass RLS + schema constraints
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await admin.from('creative_assets').insert({
    workspace_id: workspaceId,
    title: body.title,
    hook: body.hook,
    script: body.script,
    caption: body.caption,
    visual_prompt: body.visual_prompt,
    production_notes: body.production_notes ? [body.production_notes] : [],
    avatar_name: body.avatar_name,
    angle_name: body.angle_name,
    creative_type: body.concept,
    format: body.format ?? null,
    platform: body.platform ?? null,
    status: 'draft',
  }).select('id').single();

  if (error) {
    console.error('[creative/save]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, success: true });
}
