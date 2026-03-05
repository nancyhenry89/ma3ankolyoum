// src/utils/streakStore.ts
import { Preferences } from "@capacitor/preferences";

const KEY = "mk_read_days_v1"; // array of YYYY-MM-DD

function isISODate10(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function toISODate10(v: any): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();

  // already YYYY-MM-DD
  if (isISODate10(s)) return s;

  // handle ISO datetime "YYYY-MM-DDTHH..."
  const m1 = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m1 && isISODate10(m1[1])) return m1[1];

  // handle "YYYY/MM/DD"
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
  } else if (input && typeof input === "object") {
    // common legacy shapes
    if (Array.isArray((input as any).days)) {
      for (const v of (input as any).days) push(v);
    } else if (Array.isArray((input as any).readDays)) {
      for (const v of (input as any).readDays) push(v);
    }
  } else if (typeof input === "string") {
    // legacy CSV "2026-03-01,2026-03-02"
    const parts = input.split(/[,|\n]/g).map(s => s.trim()).filter(Boolean);
    for (const v of parts) push(v);
  }

  return Array.from(new Set(out)).sort(); // ISO sorts lexicographically
}

async function safeWriteIfNeeded(cleaned: string[], rawValue: string | null) {
  // if raw exists but cleaned differs, rewrite to the new canonical array format
  if (rawValue === null) return;
  try {
    const prev = JSON.stringify(JSON.parse(rawValue));
    const next = JSON.stringify(cleaned);
    if (prev !== next) {
      await Preferences.set({ key: KEY, value: next });
    }
  } catch {
    // raw wasn’t valid JSON → still migrate
    await Preferences.set({ key: KEY, value: JSON.stringify(cleaned) });
  }
}

export async function getReadDays(): Promise<string[]> {
  const { value } = await Preferences.get({ key: KEY });

  if (!value) return [];

  // try JSON first
  try {
    const parsed = JSON.parse(value);
    const cleaned = normalizeDays(parsed);
    await safeWriteIfNeeded(cleaned, value); // migrate to canonical
    return cleaned;
  } catch {
    // not JSON → maybe CSV
    const cleaned = normalizeDays(value);
    // migrate
    await Preferences.set({ key: KEY, value: JSON.stringify(cleaned) });
    return cleaned;
  }
}

export async function setReadDays(days: string[]) {
  const cleaned = normalizeDays(days);
  await Preferences.set({ key: KEY, value: JSON.stringify(cleaned) });
  return cleaned;
}

export async function addReadDay(iso: string) {
  const day = toISODate10(iso) ?? iso; // allow caller, but prefer ISO10
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

// (اختياري) للاستخدام في Debug
export async function setDebugReadDays(days: string[]) {
  return setReadDays(days);
}