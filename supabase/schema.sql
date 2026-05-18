-- ============================================================
-- CLS Engine — Full Database Schema
-- ============================================================
-- Supabase / PostgreSQL
-- RLS enabled on all tables
-- ============================================================

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────

create type hypothesis_status_enum as enum (
  'pending',
  'testing',
  'winner',
  'failed',
  'not_enough_signal'
);

create type creative_format_enum as enum (
  'story',
  'feed',
  'reel'
);

create type creative_platform_enum as enum (
  'meta',
  'tiktok',
  'google'
);

create type creative_status_enum as enum (
  'draft',
  'ready',
  'published'
);

create type integration_type_enum as enum (
  'meta',
  'google',
  'tiktok'
);

create type integration_status_enum as enum (
  'connected',
  'disconnected'
);

create type detection_status_enum as enum (
  'winner',
  'potential',
  'not_enough',
  'failed'
);

create type readiness_status_enum as enum (
  'not_ready',
  'needs_testing',
  'winner_detected',
  'ready'
);

-- ─────────────────────────────────────────────
-- TABLE: workspaces
-- ─────────────────────────────────────────────

create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

alter table public.workspaces enable row level security;

create policy "workspaces: owner full access"
  on public.workspaces
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─────────────────────────────────────────────
-- TABLE: business_profiles
-- ─────────────────────────────────────────────

create table public.business_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  workspace_id        uuid references public.workspaces (id) on delete set null,
  business_name       text not null,
  product_description text,
  transformation      text,
  problem_solved      text,
  current_offer       text,
  price_range         text,
  market_notes        text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.business_profiles enable row level security;

create policy "business_profiles: owner full access"
  on public.business_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger business_profiles_updated_at
  before update on public.business_profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- TABLE: hypotheses
-- ─────────────────────────────────────────────

create table public.hypotheses (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references public.business_profiles (id) on delete cascade,
  workspace_id       uuid references public.workspaces (id) on delete set null,
  sub_market         text,
  pain_point         text,
  desire             text,
  hook               text,
  angle              text,
  creative_type      text,
  hypothesis_status  hypothesis_status_enum not null default 'pending',
  created_at         timestamptz not null default now()
);

alter table public.hypotheses enable row level security;

create policy "hypotheses: workspace owner access"
  on public.hypotheses
  for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- TABLE: creative_assets
-- ─────────────────────────────────────────────

create table public.creative_assets (
  id             uuid primary key default gen_random_uuid(),
  hypothesis_id  uuid not null references public.hypotheses (id) on delete cascade,
  title          text,
  script         text,
  caption        text,
  prompt         text,
  format         creative_format_enum,
  platform       creative_platform_enum,
  creative_type  text,
  status         creative_status_enum not null default 'draft',
  created_at     timestamptz not null default now()
);

alter table public.creative_assets enable row level security;

create policy "creative_assets: via hypothesis workspace"
  on public.creative_assets
  for all
  using (
    hypothesis_id in (
      select h.id
      from public.hypotheses h
      join public.workspaces w on w.id = h.workspace_id
      where w.owner_id = auth.uid()
    )
  )
  with check (
    hypothesis_id in (
      select h.id
      from public.hypotheses h
      join public.workspaces w on w.id = h.workspace_id
      where w.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- TABLE: integrations
-- ─────────────────────────────────────────────

create table public.integrations (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  type          integration_type_enum not null,
  status        integration_status_enum not null default 'disconnected',
  config        jsonb,
  created_at    timestamptz not null default now()
);

alter table public.integrations enable row level security;

create policy "integrations: workspace owner access"
  on public.integrations
  for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- TABLE: meta_accounts
-- ─────────────────────────────────────────────

create table public.meta_accounts (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  meta_user_id      text not null,
  ad_account_id     text not null,
  access_token_enc  text,
  created_at        timestamptz not null default now()
);

alter table public.meta_accounts enable row level security;

create policy "meta_accounts: workspace owner access"
  on public.meta_accounts
  for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- TABLE: ad_accounts
-- ─────────────────────────────────────────────

create table public.ad_accounts (
  id               uuid primary key default gen_random_uuid(),
  meta_account_id  uuid not null references public.meta_accounts (id) on delete cascade,
  account_id       text not null,
  account_name     text,
  currency         text,
  created_at       timestamptz not null default now()
);

alter table public.ad_accounts enable row level security;

create policy "ad_accounts: via meta_account workspace"
  on public.ad_accounts
  for all
  using (
    meta_account_id in (
      select m.id
      from public.meta_accounts m
      join public.workspaces w on w.id = m.workspace_id
      where w.owner_id = auth.uid()
    )
  )
  with check (
    meta_account_id in (
      select m.id
      from public.meta_accounts m
      join public.workspaces w on w.id = m.workspace_id
      where w.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- TABLE: campaign_snapshots
-- ─────────────────────────────────────────────

create table public.campaign_snapshots (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  ad_account_id   uuid references public.ad_accounts (id) on delete set null,
  campaign_id     text not null,
  campaign_name   text,
  status          text,
  objective       text,
  budget          numeric(14, 2),
  snapshot_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

alter table public.campaign_snapshots enable row level security;

create policy "campaign_snapshots: workspace owner access"
  on public.campaign_snapshots
  for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- TABLE: ad_performance
-- ─────────────────────────────────────────────

create table public.ad_performance (
  id                    uuid primary key default gen_random_uuid(),
  campaign_snapshot_id  uuid not null references public.campaign_snapshots (id) on delete cascade,
  ad_id                 text not null,
  ad_name               text,
  hypothesis_id         uuid references public.hypotheses (id) on delete set null,
  impressions           bigint,
  clicks                bigint,
  ctr                   numeric(8, 4),
  cpc                   numeric(10, 4),
  cpa                   numeric(10, 4),
  spend                 numeric(14, 2),
  leads                 integer,
  purchases             integer,
  roas                  numeric(8, 4),
  hook_score            numeric(5, 2),
  created_at            timestamptz not null default now()
);

alter table public.ad_performance enable row level security;

create policy "ad_performance: via campaign_snapshot workspace"
  on public.ad_performance
  for all
  using (
    campaign_snapshot_id in (
      select cs.id
      from public.campaign_snapshots cs
      join public.workspaces w on w.id = cs.workspace_id
      where w.owner_id = auth.uid()
    )
  )
  with check (
    campaign_snapshot_id in (
      select cs.id
      from public.campaign_snapshots cs
      join public.workspaces w on w.id = cs.workspace_id
      where w.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- TABLE: winners
-- ─────────────────────────────────────────────

create table public.winners (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  hypothesis_id     uuid not null references public.hypotheses (id) on delete cascade,
  detection_status  detection_status_enum not null,
  confidence_score  numeric(5, 2),
  detected_at       timestamptz not null default now(),
  notes             text,
  created_at        timestamptz not null default now()
);

alter table public.winners enable row level security;

create policy "winners: workspace owner access"
  on public.winners
  for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- TABLE: ltv_models
-- ─────────────────────────────────────────────

create table public.ltv_models (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces (id) on delete cascade,
  front_end_price       numeric(12, 2),
  upsell_value          numeric(12, 2),
  subscription_value    numeric(12, 2),
  retention_months      integer,
  aov                   numeric(12, 2),
  margin                numeric(5, 2),
  estimated_ltv         numeric(14, 2),
  cac_gap               numeric(14, 2),
  profit_per_customer   numeric(14, 2),
  created_at            timestamptz not null default now()
);

alter table public.ltv_models enable row level security;

create policy "ltv_models: workspace owner access"
  on public.ltv_models
  for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- TABLE: scale_scores
-- ─────────────────────────────────────────────

create table public.scale_scores (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid not null references public.workspaces (id) on delete cascade,
  winners_count           integer not null default 0,
  avg_cac                 numeric(12, 4),
  avg_ltv                 numeric(12, 4),
  avg_roas                numeric(8, 4),
  conversion_consistency  numeric(5, 2),
  spend_stability         numeric(5, 2),
  readiness_status        readiness_status_enum not null default 'not_ready',
  score                   numeric(5, 2),
  created_at              timestamptz not null default now()
);

alter table public.scale_scores enable row level security;

create policy "scale_scores: workspace owner access"
  on public.scale_scores
  for all
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  )
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- INDEXES (performance)
-- ─────────────────────────────────────────────

create index on public.workspaces (owner_id);
create index on public.business_profiles (user_id);
create index on public.business_profiles (workspace_id);
create index on public.hypotheses (workspace_id);
create index on public.hypotheses (business_id);
create index on public.creative_assets (hypothesis_id);
create index on public.integrations (workspace_id);
create index on public.meta_accounts (workspace_id);
create index on public.ad_accounts (meta_account_id);
create index on public.campaign_snapshots (workspace_id);
create index on public.campaign_snapshots (ad_account_id);
create index on public.ad_performance (campaign_snapshot_id);
create index on public.ad_performance (hypothesis_id);
create index on public.winners (workspace_id);
create index on public.winners (hypothesis_id);
create index on public.ltv_models (workspace_id);
create index on public.scale_scores (workspace_id);
