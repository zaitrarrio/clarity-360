import { supabase } from "@/integrations/supabase/client";
import { readStoredSeed, storeSeed, type Seed } from "./industries";
import {
  clearPlanProgress,
  latestPlanProgress,
  readPlanProgress,
  savePlanProgress,
} from "./progress.functions";
import type { Correction, Decision, DraftRound, ForkRound } from "./onboarding.types";

const KEY = "clarity360.progress.v1";

export type DraftProgress = {
  mode: "draft";
  seedName: string;
  savedAt: number;
  pass: number;
  round: DraftRound | null;
  corrections: Correction[];
  picked: Record<string, { label: string; result: string }>;
};

export type ForkProgress = {
  mode: "forks";
  seedName: string;
  savedAt: number;
  round: ForkRound | null;
  index: number;
  decisions: Decision[];
  summary: boolean;
};

export type Progress = DraftProgress | ForkProgress;

export function saveProgress(progress: Progress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...progress, savedAt: Date.now() }));
  } catch {
    /* storage unavailable — progress is best effort */
  }
}

export function readProgress<T extends Progress["mode"]>(
  mode: T,
  seedName: string,
): Extract<Progress, { mode: T }> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Progress;
    if (parsed?.mode !== mode || parsed.seedName !== seedName || !parsed.round) return null;
    return parsed as Extract<Progress, { mode: T }>;
  } catch {
    return null;
  }
}

export function clearProgress() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}

export function savedAtLabel(savedAt: number) {
  const mins = Math.round((Date.now() - savedAt) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

// ---------- server sync (resume from another browser after signing in) ----------

async function signedIn() {
  try {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  } catch {
    return false;
  }
}

let pushTimer: ReturnType<typeof setTimeout> | undefined;

/** Best-effort debounced push of the current progress (plus its seed) to the account. */
export function syncProgress(progress: Progress, seed: Seed) {
  if (typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void (async () => {
      if (!(await signedIn())) return;
      try {
        await savePlanProgress({
          data: {
            mode: progress.mode,
            seedName: progress.seedName,
            payload: JSON.stringify({ progress, seed }),
          },
        });
      } catch {
        /* offline or signed out — local copy still holds */
      }
    })();
  }, 900);
}

function unwrap<T extends Progress["mode"]>(
  mode: T,
  raw: string | null | undefined,
): { progress: Extract<Progress, { mode: T }>; seed: Seed } | null {
  if (!raw) return null;
  let parsed: { progress?: Progress; seed?: Seed };
  try {
    parsed = JSON.parse(raw) as { progress?: Progress; seed?: Seed };
  } catch {
    return null;
  }
  const { progress, seed } = parsed;
  if (!progress || progress.mode !== mode || !progress.round || !seed?.name) return null;
  return { progress: progress as Extract<Progress, { mode: T }>, seed };
}

/**
 * Returns the freshest progress for this mode: the local copy, or the account copy
 * when it is newer (or when this browser has none). Restores the seed as a side effect.
 */
export async function resumeProgress<T extends Progress["mode"]>(
  mode: T,
  seedName: string | null,
): Promise<{ progress: Extract<Progress, { mode: T }>; seed: Seed } | null> {
  const local = seedName ? readProgress(mode, seedName) : null;
  const localSeed = readStoredSeed();
  if (!(await signedIn())) return local && localSeed ? { progress: local, seed: localSeed } : null;

  try {
    const row = seedName
      ? await readPlanProgress({ data: { mode, seedName } })
      : await latestPlanProgress({ data: { mode } });
    const remote = unwrap(mode, row?.payload ?? null);
    if (!remote) return local && localSeed ? { progress: local, seed: localSeed } : null;
    if (local && local.savedAt >= remote.progress.savedAt) {
      return { progress: local, seed: localSeed ?? remote.seed };
    }
    storeSeed(remote.seed);
    saveProgress(remote.progress);
    return remote;
  } catch {
    return local && localSeed ? { progress: local, seed: localSeed } : null;
  }
}

/**
 * Push whatever this browser holds to the account right now (used straight after
 * sign-in, so answers given while signed out are never stranded in one browser).
 */
export async function flushLocalProgress() {
  if (typeof window === "undefined") return;
  const seed = readStoredSeed();
  if (!seed) return;
  let progress: Progress | null = null;
  try {
    const raw = window.localStorage.getItem(KEY);
    progress = raw ? (JSON.parse(raw) as Progress) : null;
  } catch {
    return;
  }
  if (!progress?.round) return;
  if (!(await signedIn())) return;
  try {
    await savePlanProgress({
      data: {
        mode: progress.mode,
        seedName: progress.seedName,
        payload: JSON.stringify({ progress, seed }),
      },
    });
  } catch {
    /* best effort */
  }
}

export async function clearProgressEverywhere() {
  clearProgress();
  if (!(await signedIn())) return;
  try {
    await clearPlanProgress({});
  } catch {
    /* no-op */
  }
}
