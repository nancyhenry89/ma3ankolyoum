const KEY = "mk_streak_meta_v2";

export type StreakMeta = {
  bankMilestone?: number;
  softResetBase?: number;
  softResetState?: "armed" | "running";
  softResetUntilISO?: string;
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

  if (!m || typeof m !== "object") return {};

  return {
    bankMilestone: m.bankMilestone,
    softResetBase: m.softResetBase,
    softResetState: m.softResetState,
    softResetUntilISO: m.softResetUntilISO,
  };
}

export async function setStreakMeta(meta: StreakMeta): Promise<void> {
  localStorage.setItem(KEY, JSON.stringify(meta));
}

export async function clearStreakMeta(): Promise<void> {
  localStorage.removeItem(KEY);
}