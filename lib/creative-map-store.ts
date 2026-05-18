// ─── Creative Map Persistence ─────────────────────────────────────────────────
//
// Two-layer persistence:
//   1. localStorage  — instant, survives page refresh, cleared on "Start Over"
//   2. Supabase      — authoritative, survives device switch / incognito
//
// Usage:
//   On mount  → loadCreativeSession (localStorage first, then Supabase)
//   On change → saveCreativeSession (both layers)
//   On reset  → clearCreativeSession (both layers)

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  ageRange: string;
  role: string;
  painPoint: string;
  coreDesire: string;
  buyingTrigger: string;
}

export interface Angle {
  id: string;
  avatarId: string;
  name: string;
  hookLine: string;
  format: 'UGC' | 'Static' | 'Video' | 'Carousel';
}

export interface CreativeSession {
  workspace_id: string;
  step: number;
  avatars: Avatar[];
  selected_avatar_ids: string[];
  angles: Angle[];
  selected_angle_ids: string[];
  concepts: string[];
  business_profile_id: string | null;
}

// ─── localStorage key ─────────────────────────────────────────────────────────

const LS_KEY = 'cls_map_session';

// ─── localStorage helpers ────────────────────────────────────────────────────

function readLocalSession(): CreativeSession | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CreativeSession;
  } catch {
    return null;
  }
}

function writeLocalSession(data: Partial<CreativeSession> & { workspace_id: string }): void {
  try {
    const existing = readLocalSession() ?? ({} as Partial<CreativeSession>);
    const merged = { ...existing, ...data };
    localStorage.setItem(LS_KEY, JSON.stringify(merged));
  } catch {
    // localStorage may be unavailable (SSR, private mode quota)
  }
}

function removeLocalSession(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

/**
 * Save (upsert) the current Creative Map state to Supabase.
 * Errors are swallowed — the localStorage layer is the fallback.
 */
export async function saveCreativeSession(
  workspaceId: string,
  data: Partial<CreativeSession>
): Promise<void> {
  // Always persist to localStorage first (instant)
  writeLocalSession({ ...data, workspace_id: workspaceId });

  // Then persist to Supabase (authoritative, async)
  try {
    const supabase = createClient();

    const payload = {
      workspace_id: workspaceId,
      step: data.step,
      avatars: data.avatars ?? [],
      selected_avatar_ids: data.selected_avatar_ids ?? [],
      angles: data.angles ?? [],
      selected_angle_ids: data.selected_angle_ids ?? [],
      concepts: data.concepts ?? [],
      business_profile_id: data.business_profile_id ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('creative_sessions')
      .upsert(payload, { onConflict: 'workspace_id' });

    if (error) {
      // Table may not exist yet — log but don't throw
      console.warn('[creative-map-store] Supabase upsert failed:', error.message);
    }
  } catch (err) {
    console.warn('[creative-map-store] Supabase error:', err);
  }
}

/**
 * Load the Creative Map session.
 * Returns localStorage data immediately (or null), then caller can await
 * Supabase for the authoritative version.
 */
export function loadCreativeSessionLocal(): CreativeSession | null {
  return readLocalSession();
}

/**
 * Load the Creative Map session from Supabase.
 * Returns null on any error (table missing, not authed, network, etc.).
 */
export async function loadCreativeSession(workspaceId: string): Promise<CreativeSession | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('creative_sessions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) {
      console.warn('[creative-map-store] Supabase load failed:', error.message);
      return null;
    }

    if (!data) return null;

    const session: CreativeSession = {
      workspace_id: data.workspace_id as string,
      step: (data.step as number) ?? 1,
      avatars: (data.avatars as Avatar[]) ?? [],
      selected_avatar_ids: (data.selected_avatar_ids as string[]) ?? [],
      angles: (data.angles as Angle[]) ?? [],
      selected_angle_ids: (data.selected_angle_ids as string[]) ?? [],
      concepts: (data.concepts as string[]) ?? [],
      business_profile_id: (data.business_profile_id as string | null) ?? null,
    };

    // Keep localStorage in sync with authoritative Supabase data
    writeLocalSession(session);
    return session;
  } catch (err) {
    console.warn('[creative-map-store] Supabase error:', err);
    return null;
  }
}

/**
 * Clear all Creative Map state — both localStorage and Supabase row.
 */
export async function clearCreativeSession(workspaceId: string): Promise<void> {
  removeLocalSession();

  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('creative_sessions')
      .delete()
      .eq('workspace_id', workspaceId);

    if (error) {
      console.warn('[creative-map-store] Supabase delete failed:', error.message);
    }
  } catch (err) {
    console.warn('[creative-map-store] Supabase error:', err);
  }
}
