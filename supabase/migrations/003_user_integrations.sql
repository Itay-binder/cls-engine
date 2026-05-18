-- ============================================================
-- Migration: 003_user_integrations
-- Purpose:   Per-user API key storage (Anthropic, Meta, etc.)
--            Each workspace stores its own credentials.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  anthropic_api_key    text,
  meta_access_token    text,
  meta_ad_account_id   text,
  meta_page_id         text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_integrations_workspace_unique UNIQUE (workspace_id)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_integrations'
      AND policyname = 'user_integrations_owner'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY user_integrations_owner
        ON public.user_integrations
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
