import { supabase } from "@/integrations/supabase/client";
import { normaliseSeed, storeSeed, type Seed } from "./industries";
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
            payload: { progress, seed } as unknown as Record<string, unknown>,
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
  payload: Record<string, unknown> | null | undefined,
): { progress: Extract<Progress, { mode: T }>; seed: Seed } | null {
  const progress = payload?.["progress"] as Progress | undefined;
  const seed = payload?.["seed"] as Seed | undefined;
  if (!progress || progress.mode !== mode || !progress.round || !seed?.name) return null;
  return { progress: progress as Extract<Progress, { mode: T }>, seed: normaliseSeed(seed) };
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
  if (!(await signedIn())) return local ? { progress: local, seed: readSeedOrNull() } : null;

  try {
    const row = seedName
      ? await readPlanProgress({ data: { mode, seedName } })
      : await latestPlanProgress({ data: { mode } });
    const remote = unwrap(mode, row?.payload);
    if (!remote) return local ? { progress: local, seed: readSeedOrNull() } : null;
    if (local && local.savedAt >= remote.progress.savedAt) {
      return { progress: local, seed: readSeedOrNull() ?? remote.seed };
    }
    storeSeed(remote.seed);
    saveProgress(remote.progress);
    return remote;
  } catch {
    return local ? { progress: local, seed: readSeedOrNull() } : null;
  }
}

function readSeedOrNull(): Seed {
  return { ...(JSON.parse(window.sessionStorage.getItem("clarity360.seed.v1") ?? "null") ?? {}) } as Seed;
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
