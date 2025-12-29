import { Preferences } from '@capacitor/preferences'

const KEY = 'mk_streak_meta_v1'

export type StreakMeta = {
    softResetBase?: number;
    bankMilestone?: number; // ✅ persistent milestone user earned
  };
  
  export type StreakMeta = {
    softResetBase?: number;
    softResetUsed?: boolean;
    bankMilestone?: number;
  };
  

export async function getStreakMeta(): Promise<StreakMeta> {
  const { value } = await Preferences.get({ key: KEY })
  if (!value) return { ...DEFAULT_META }
  try {
    const m = JSON.parse(value)
    return {
      streak: Number(m?.streak || 0),
      best: Number(m?.best || 0),
      lastReadISO: m?.lastReadISO ? String(m.lastReadISO) : null,
      softResetAppliedOnISO: m?.softResetAppliedOnISO ? String(m.softResetAppliedOnISO) : null,
    }
  } catch {
    return { ...DEFAULT_META }
  }
}

export async function setStreakMeta(meta: StreakMeta) {
  await Preferences.set({ key: KEY, value: JSON.stringify(meta) })
  return meta
}
