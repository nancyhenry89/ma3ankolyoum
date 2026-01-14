// src/utils/spiritualNotesLogic.ts

function pad(n: number) {
    return String(n).padStart(2, "0");
  }
  
  function parseISO(iso: string) {
    // iso: YYYY-MM-DD
    const [y, m, d] = iso.split("-").map(Number);
    return { y, m, d };
  }
  
  function formatISO(dateUTC: Date) {
    const y = dateUTC.getUTCFullYear();
    const m = dateUTC.getUTCMonth() + 1;
    const d = dateUTC.getUTCDate();
    return `${y}-${pad(m)}-${pad(d)}`;
  }
  
  // ✅ timezone-safe (UTC) add days
  export function addDaysISO(iso: string, days: number) {
    const { y, m, d } = parseISO(iso);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    return formatISO(dt);
  }
  
  // ✅ timezone-safe (UTC) diff days
  export function diffDaysISO(fromISO: string, toISO: string) {
    const a = parseISO(fromISO);
    const b = parseISO(toISO);
    const ta = Date.UTC(a.y, a.m - 1, a.d);
    const tb = Date.UTC(b.y, b.m - 1, b.d);
    return Math.floor((tb - ta) / (1000 * 60 * 60 * 24));
  }
  
  export function sortISO(days: string[]) {
    return [...days].filter(Boolean).sort();
  }
  
  export function firstDoneISO(days: string[]) {
    const s = sortISO(days);
    return s.length ? s[0] : null;
  }
  
  export function lastDoneISO(days: string[]) {
    const s = sortISO(days);
    return s.length ? s[s.length - 1] : null;
  }
  
  export function isWeeklyOverdue(days: string[], todayISO: string) {
    const last = lastDoneISO(days);
    if (!last) return { overdue: false, daysSince: 0 }; // never recorded => no reminder
    const d = diffDaysISO(last, todayISO);
    if (d < 0) return { overdue: false, daysSince: 0 }; // debug future safety
    return { overdue: d >= 7, daysSince: d };
  }
  
  export function isMonthlyOverdue(days: string[], todayISO: string) {
    const last = lastDoneISO(days);
    if (!last) return { overdue: false, daysSince: 0 }; // never recorded => no reminder
    const d = diffDaysISO(last, todayISO);
    if (d < 0) return { overdue: false, daysSince: 0 }; // debug future safety
    return { overdue: d >= 30, daysSince: d };
  }
  