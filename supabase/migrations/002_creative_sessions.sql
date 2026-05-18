-- ============================================================
-- Migration: 002_creative_sessions
-- Purpose:   Add creative_sessions table + update creative_assets
--            for Creative Map feature.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste this file → Run
--   (idempotent — safe to run multiple times)
-- ============================================================

-- ─── Update creative_assets: make hypothesis_id nullable, add missing columns ─

ALTER TABLE public.creative_assets
  ALTER COLUMN hypothesis_id DROP NOT NULL;

ALTER TABLE public.creative_assets
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS hook         text,
  ADD COLUMN IF NOT EXISTS visual_prompt text,
  ADD COLUMN IF NOT EXISTS production_notes text[],
  ADD COLUMN IF NOT EXISTS language     text,
  ADD COLUMN IF NOT EXISTS cta          text,
  ADD COLUMN IF NOT EXISTS meta_creative_id text,
  ADD COLUMN IF NOT EXISTS avatar_name  text,
  ADD COLUMN IF NOT EXISTS angle_name   text;

CREATE INDEX IF NOT EXISTS creative_assets_workspace_id_idx
  ON public.creative_assets (workspace_id);

-- Update RLS policy to allow workspace-based access (without hypothesis_id)
DROP POLICY IF EXISTS "creative_assets: via hypothesis workspace" ON public.creative_assets;
CREATE POLICY "creative_assets: via hypothesis workspace"
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

-- ─── Create creative_sessions table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creative_sessions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  step                 integer     NOT NULL DEFAULT 1,
  avatars              jsonb       NOT NULL DEFAULT '[]',
  selected_avatar_ids  text[]      NOT NULL DEFAULT '{}',
  angles               jsonb       NOT NULL DEFAULT '[]',
  selected_angle_ids   text[]      NOT NULL DEFAULT '{}',
  concepts             text[]      NOT NULL DEFAULT '{}',
  business_profile_id  uuid        REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creative_sessions_workspace_unique UNIQUE (workspace_id)
);

ALTER TABLE public.creative_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'creative_sessions'
      AND policyname = 'creative_sessions_owner'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY creative_sessions_owner
        ON public.creative_sessions
        FOR ALL
        TO authenticated
        USING (workspace_id IN (
          SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        ))
        WITH CHECK (workspace_id IN (
          SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        ))
    $policy$;
  END IF;
END;
$$;
