/**
 * Singleton creative generator — survives React component unmounts.
 * Generates all creative briefs concurrently and caches them in localStorage.
 */

import type { Avatar, Angle, CreativeBrief, BusinessProfile } from './creative-generator-types';

export type { Avatar, Angle, CreativeBrief, BusinessProfile };

// ─── Cache helpers ────────────────────────────────────────────────────────────

const CACHE_PREFIX = 'cls-brief-v2-';

export function cellKey(avatarId: string, angleId: string, concept: string): string {
  return `${avatarId}__${angleId}__${encodeURIComponent(concept)}`;
}

export function saveCachedBrief(key: string, brief: CreativeBrief): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(brief));
  } catch { /* storage full — ignore */ }
}

export function loadCachedBrief(key: string): CreativeBrief | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as CreativeBrief) : null;
  } catch {
    return null;
  }
}

export function clearBriefCache(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

// ─── Progress state ───────────────────────────────────────────────────────────

export interface GenerationProgress {
  total: number;
  completed: number;
  inProgress: Set<string>;
  errors: Set<string>;
  isRunning: boolean;
  startedAt: number;
}

type ProgressCallback = (state: GenerationProgress) => void;

const listeners = new Set<ProgressCallback>();

let state: GenerationProgress = {
  total: 0,
  completed: 0,
  inProgress: new Set(),
  errors: new Set(),
  isRunning: false,
  startedAt: 0,
};

function notify(): void {
  const snapshot: GenerationProgress = {
    ...state,
    inProgress: new Set(state.inProgress),
    errors: new Set(state.errors),
  };
  listeners.forEach((fn) => fn(snapshot));
}

export function getProgress(): GenerationProgress {
  return {
    ...state,
    inProgress: new Set(state.inProgress),
    errors: new Set(state.errors),
  };
}

export function subscribeToGeneration(fn: ProgressCallback): () => void {
  listeners.add(fn);
  fn(getProgress());
  return () => { listeners.delete(fn); };
}

// ─── Cell type ────────────────────────────────────────────────────────────────

export interface GenerationCell {
  key: string;
  avatar: Avatar;
  angle: Angle;
  concept: string;
  businessProfile: BusinessProfile | null;
}

// ─── Generator ───────────────────────────────────────────────────────────────

const CONCURRENCY = 3;

export async function startGeneration(cells: GenerationCell[]): Promise<void> {
  if (state.isRunning) return; // already running

  const toGenerate = cells.filter((c) => !loadCachedBrief(c.key));
  const alreadyDone = cells.length - toGenerate.length;

  state = {
    total: cells.length,
    completed: alreadyDone,
    inProgress: new Set(),
    errors: new Set(),
    isRunning: toGenerate.length > 0,
    startedAt: Date.now(),
  };
  notify();

  if (toGenerate.length === 0) return;

  const queue = [...toGenerate];

  const worker = async () => {
    while (queue.length > 0) {
      const cell = queue.shift();
      if (!cell) break;

      state.inProgress.add(cell.key);
      notify();

      try {
        const res = await fetch('/api/ai/creative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            avatar: cell.avatar,
            angle: cell.angle,
            concept: cell.concept,
            businessProfile: cell.businessProfile,
          }),
        });

        if (res.ok) {
          const brief = await res.json() as CreativeBrief;
          saveCachedBrief(cell.key, brief);
          state.completed++;
        } else {
          state.errors.add(cell.key);
        }
      } catch {
        state.errors.add(cell.key);
      }

      state.inProgress.delete(cell.key);
      if (state.completed + state.errors.size >= state.total) {
        state.isRunning = false;
      }
      notify();
    }
  };

  // Fire CONCURRENCY workers concurrently (don't await — let them run in background)
  void Promise.all(Array.from({ length: Math.min(CONCURRENCY, toGenerate.length) }, worker))
    .then(() => {
      state.isRunning = false;
      notify();
    });
}

export function resetGeneration(): void {
  state = {
    total: 0,
    completed: 0,
    inProgress: new Set(),
    errors: new Set(),
    isRunning: false,
    startedAt: 0,
  };
  notify();
}
