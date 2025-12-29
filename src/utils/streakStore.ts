import { Preferences } from "@capacitor/preferences";

const KEY = "mk_read_days_v1"; // array of YYYY-MM-DD

export async function getReadDays(): Promise<string[]> {
  const { value } = await Preferences.get({ key: KEY });
  const arr = value ? JSON.parse(value) : [];
  return Array.isArray(arr) ? arr : [];
}

export async function setReadDays(days: string[]) {
  const uniq = Array.from(new Set(days)).sort();
  await Preferences.set({ key: KEY, value: JSON.stringify(uniq) });
  return uniq;
}

export async function addReadDay(iso: string) {
  const days = await getReadDays();
  days.push(iso);
  return setReadDays(days);
}

export async function removeReadDay(iso: string) {
  const days = await getReadDays();
  return setReadDays(days.filter(d => d !== iso));
}

export async function clearReadDays() {
  return setReadDays([]);
}

// (اختياري) للاستخدام في Debug
export async function setDebugReadDays(days: string[]) {
  return setReadDays(days);
}
