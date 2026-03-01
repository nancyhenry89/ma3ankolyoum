// src/utils/debugGate.ts
import { Preferences } from "@capacitor/preferences";

const KEY = "mk_debug_unlocked";

// ✅ حطيه في .env لو تحبي (أفضل)
// VITE_DEBUG_PIN=2468
const DEBUG_PIN = import.meta.env.VITE_DEBUG_PIN || "0224199486";

export async function isDebugUnlocked() {
  const v = await Preferences.get({ key: KEY });
  return v.value === "1";
}

export async function unlockDebug(pin: string) {
  if ((pin || "").trim() !== DEBUG_PIN) return false;
  await Preferences.set({ key: KEY, value: "1" });
  return true;
}

export async function lockDebug() {
  await Preferences.remove({ key: KEY });
}