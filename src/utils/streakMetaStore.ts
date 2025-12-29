// src/utils/streakMetaStore.ts

const KEY = "mk_streak_meta_v1";

export type StreakMeta = {
  /** Highest milestone user has EVER earned (7/14/21/28/90/180/365...) */
  bankMilestone?: number;

  /** Soft reset base milestone (e.g. 90) */
  softResetBase?: number;

  /** Soft reset state:
   *  - armed: show base temporarily while streak is broken (today streak = 0)
   *  - running: once user reads again, we add base + new streak
   */
  softResetState?: "armed" | "running";

  /** Expiration for "armed" mode (ISO date) */
  softResetUntilISO?: string;
};

const DEFAULT_META: StreakMeta = {
  // intentionally empty defaults
};

function safeParse(json: string | null): any {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function getStreakMeta(): Promise<StreakMeta> {
  const raw = localStorage.getItem(KEY);
  const m = safeParse(raw);

  if (!m || typeof m !== "object") return { ...DEFAULT_META };

  // ✅ Only keep known fields (prevents garbage from breaking your logic)
  const meta: StreakMeta = {
    bankMilestone: typeof m.bankMilestone === "number" ? m.bankMilestone : undefined,
    softResetBase: typeof m.softResetBase === "number" ? m.softResetBase : undefined,
    softResetState: m.softResetState === "armed" || m.softResetState === "running" ? m.softResetState : undefined,
    softResetUntilISO: typeof m.softResetUntilISO === "string" ? m.softResetUntilISO : undefined,
  };

  return { ...DEFAULT_META, ...meta };
}

export async function setStreakMeta(meta: StreakMeta): Promise<void> {
  // small cleanup: remove undefined keys so storage stays clean
  const cleaned: StreakMeta = {};
  if (typeof meta.bankMilestone === "number") cleaned.bankMilestone = meta.bankMilestone;
  if (typeof meta.softResetBase === "number") cleaned.softResetBase = meta.softResetBase;
  if (meta.softResetState === "armed" || meta.softResetState === "running") cleaned.softResetState = meta.softResetState;
  if (typeof meta.softResetUntilISO === "string") cleaned.softResetUntilISO = meta.softResetUntilISO;

  localStorage.setItem(KEY, JSON.stringify(cleaned));
}

export async function clearStreakMeta(): Promise<void> {
  localStorage.removeItem(KEY);
}
