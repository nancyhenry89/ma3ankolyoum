import { Preferences } from "@capacitor/preferences";

const KEY = "mk_read_days_v2";

function isISODate10(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toISODate10(v: any): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();

  if (isISODate10(s)) return s;

  const m1 = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m1 && isISODate10(m1[1])) return m1[1];

  const m2 = s.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (m2) {
    const iso = `${m2[1]}-${m2[2]}-${m2[3]}`;
    return isISODate10(iso) ? iso : null;
  }

  return null;
}

function normalizeDays(input: any): string[] {
  const out: string[] = [];

  const push = (x: any) => {
    const iso = toISODate10(x);
    if (iso) out.push(iso);
  };

  if (Array.isArray(input)) {
    for (const v of input) push(v);
  }

  return Array.from(new Set(out)).sort();
}

export async function getReadDays(): Promise<string[]> {
  const { value } = await Preferences.get({ key: KEY });
  if (!value) return [];

  try {
    return normalizeDays(JSON.parse(value));
  } catch {
    return [];
  }
}

export async function setReadDays(days: string[]) {
  const cleaned = normalizeDays(days);
  await Preferences.set({ key: KEY, value: JSON.stringify(cleaned) });
  return cleaned;
}

export async function addReadDay(iso: string) {
  const day = toISODate10(iso) ?? iso;
  const days = await getReadDays();
  days.push(day);
  return setReadDays(days);
}

export async function removeReadDay(iso: string) {
  const day = toISODate10(iso) ?? iso;
  const days = await getReadDays();
  return setReadDays(days.filter(d => d !== day));
}

export async function clearReadDays() {
  return setReadDays([]);
}