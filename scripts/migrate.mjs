const sql = `
ALTER TABLE public.creative_assets
  ALTER COLUMN hypothesis_id DROP NOT NULL;

ALTER TABLE public.creative_assets
  ADD COLUMN IF NOT EXISTS workspace_id uuid references public.workspaces(id) on delete cascade,
  ADD COLUMN IF NOT EXISTS hook text,
  ADD COLUMN IF NOT EXISTS visual_prompt text,
  ADD COLUMN IF NOT EXISTS production_notes text[],
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS cta text,
  ADD COLUMN IF NOT EXISTS meta_creative_id text,
  ADD COLUMN IF NOT EXISTS avatar_name text,
  ADD COLUMN IF NOT EXISTS angle_name text;

CREATE INDEX IF NOT EXISTS creative_assets_workspace_id_idx ON public.creative_assets (workspace_id);

CREATE TABLE IF NOT EXISTS public.creative_sessions (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces(id) on delete cascade,
  step                  integer not null default 1,
  avatars               jsonb not null default '[]',
  selected_avatar_ids   text[] not null default '{}',
  angles                jsonb not null default '[]',
  selected_angle_ids    text[] not null default '{}',
  concepts              text[] not null default '{}',
  business_profile_id   uuid,
  updated_at            timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  UNIQUE(workspace_id)
);

ALTER TABLE public.creative_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creative_sessions_owner" ON public.creative_sessions;
CREATE POLICY "creative_sessions_owner"
  ON public.creative_sessions
  FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "creative_assets_via_hypothesis_workspace" ON public.creative_assets;
DROP POLICY IF EXISTS "creative_assets: via hypothesis workspace" ON public.creative_assets;
CREATE POLICY "creative_assets_via_hypothesis_workspace"
  ON public.creative_assets
  FOR ALL
  USING (
    (hypothesis_id IS NOT NULL AND hypothesis_id IN (
      SELECT h.id FROM public.hypotheses h
      JOIN public.workspaces w ON w.id = h.workspace_id
      WHERE w.owner_id = auth.uid()
    ))
    OR
    (workspace_id IS NOT NULL AND workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    ))
  )
  WITH CHECK (
    (hypothesis_id IS NOT NULL AND hypothesis_id IN (
      SELECT h.id FROM public.hypotheses h
      JOIN public.workspaces w ON w.id = h.workspace_id
      WHERE w.owner_id = auth.uid()
    ))
    OR
    (workspace_id IS NOT NULL AND workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    ))
  );
`;

const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidWd5Ym5iZ3pxd3BwZWZxd3ZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEwODIyMSwiZXhwIjoyMDk0Njg0MjIxfQ.uP0W5PsL2pbzqfWZ4CRHcGC_S_aEVIDIwAVXCfY3-Kw';
const PROJECT_REF = 'tbugybnbgzqwppefqwvb';

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const json = await res.json();
console.log(JSON.stringify(json, null, 2));
