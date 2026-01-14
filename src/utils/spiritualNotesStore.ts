import { Preferences } from "@capacitor/preferences";

export type HabitKey = "morning" | "bible" | "sleep" | "communion" | "confession";

const HABIT_KEY = (k: HabitKey) => `mk_notes_habit_${k}_v1`; // array of ISO days
const NOTE_KEY = (iso: string) => `mk_notes_note_${iso}_v1`; // text note for day

function safeArr(v: string | null): string[] {
  if (!v) return [];
  try {
    const x = JSON.parse(v);
    return Array.isArray(x) ? x.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function uniqSorted(days: string[]) {
  return Array.from(new Set(days)).filter(Boolean).sort();
}

export async function getHabitDays(key: HabitKey): Promise<string[]> {
  const { value } = await Preferences.get({ key: HABIT_KEY(key) });
  return uniqSorted(safeArr(value));
}

export async function setHabitDays(key: HabitKey, days: string[]) {
  const cleaned = uniqSorted(days);
  await Preferences.set({ key: HABIT_KEY(key), value: JSON.stringify(cleaned) });
  return cleaned;
}

export async function addHabitDay(key: HabitKey, iso: string) {
  const days = await getHabitDays(key);
  days.push(iso);
  return setHabitDays(key, days);
}

export async function removeHabitDay(key: HabitKey, iso: string) {
  const days = await getHabitDays(key);
  return setHabitDays(key, days.filter(d => d !== iso));
}

export async function clearHabitDays(key: HabitKey) {
  return setHabitDays(key, []);
}

export async function getDailyNote(iso: string): Promise<string> {
  const { value } = await Preferences.get({ key: NOTE_KEY(iso) });
  return value ?? "";
}

export async function setDailyNote(iso: string, note: string) {
  await Preferences.set({ key: NOTE_KEY(iso), value: note ?? "" });
}

/**
 * ✅ Important: your manual localStorage deletion was not reliable.
 * This clears ALL spiritual notes keys via Preferences API itself.
 */

export async function clearAllNotesStorage() {
  const keysToDelete: string[] = [];

  // habits
  const habits: HabitKey[] = ["morning", "bible", "sleep", "communion", "confession"];
  for (const h of habits) keysToDelete.push(HABIT_KEY(h));

  // notes: we can't list all notes by pattern with Preferences,
  // so we do a best-effort by reading raw localStorage CapacitorStorage (web)
  // AND still delete known habit keys above.
  // On native this won't exist, but native tests should use clearHabitDays per key.

  try {
    const raw = localStorage.getItem("CapacitorStorage");
    if (raw) {
      const obj = JSON.parse(raw);
      for (const k of Object.keys(obj)) {
        if (k.startsWith("mk_notes_note_") || k.startsWith("mk_notes_habit_")) {
          keysToDelete.push(k);
        }
      }
    }
  } catch {}

  // uniq
  const uniq = Array.from(new Set(keysToDelete));

  for (const k of uniq) {
    try {
      await Preferences.remove({ key: k });
    } catch {}
  }
}
