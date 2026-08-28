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
