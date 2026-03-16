import { Preferences } from "@capacitor/preferences"

const KEY = "mk_streak_profile_v2"

export type StreakProfile = {
  version: number
  userType: "new" | "old"
  giftClaimed: boolean
}

async function readRaw(): Promise<any | null> {
  const { value } = await Preferences.get({ key: KEY })
  if (!value) return null

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

async function detectOldUser(): Promise<boolean> {
  const oldDays = await Preferences.get({ key: "mk_read_days_v1" })
  const oldMeta = localStorage.getItem("mk_streak_meta_v1")

  const hasOldDaysKey = oldDays.value !== null
  const hasOldMeta = oldMeta !== null

  return hasOldDaysKey || hasOldMeta
}

export async function getStreakProfile(): Promise<StreakProfile> {
  const existing = await readRaw()

  if (
    existing &&
    typeof existing === "object" &&
    existing.version === 2 &&
    (existing.userType === "new" || existing.userType === "old") &&
    typeof existing.giftClaimed === "boolean"
  ) {
    return existing as StreakProfile
  }

  const isOld = await detectOldUser()

  const profile: StreakProfile = {
    version: 2,
    userType: isOld ? "old" : "new",
    giftClaimed: false,
  }

  await Preferences.set({ key: KEY, value: JSON.stringify(profile) })
  return profile
}

export async function setStreakProfile(profile: StreakProfile): Promise<void> {
  const cleaned: StreakProfile = {
    version: 2,
    userType: profile.userType === "old" ? "old" : "new",
    giftClaimed: !!profile.giftClaimed,
  }

  await Preferences.set({ key: KEY, value: JSON.stringify(cleaned) })
}

export async function claimGift(profile: StreakProfile): Promise<StreakProfile> {
  if (profile.giftClaimed) return profile

  const updated: StreakProfile = {
    ...profile,
    giftClaimed: true,
  }

  await setStreakProfile(updated)
  return updated
}

export async function clearStreakProfile(): Promise<void> {
  await Preferences.remove({ key: KEY })
}