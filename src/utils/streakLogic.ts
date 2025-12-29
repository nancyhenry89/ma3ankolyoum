// src/utils/streakLogic.ts

function pad(n: number) {
    return String(n).padStart(2, "0");
  }
  
  export function addDays(iso: string, n: number) {
    const d = new Date(`${iso}T00:00:00`);
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  
  /**
   * computeStreak:
   * - لو اليوم متعلم => نبدأ من اليوم
   * - لو اليوم مش متعلم لكن أمس متعلم => نبدأ من أمس (عشان الستريك ما يبقاش 0 قبل ما يعلّم اليوم)
   * - غير كده => streak = 0
   */
  export function computeStreak(days: string[], todayISO: string) {
    const set = new Set(days);
  
    let startISO = todayISO;
    if (!set.has(todayISO) && set.has(addDays(todayISO, -1))) {
      startISO = addDays(todayISO, -1);
    } else if (!set.has(todayISO)) {
      return { streak: 0, streakDays: [] as string[] };
    }
  
    const streakDays: string[] = [];
    let cursor = startISO;
    while (set.has(cursor)) {
      streakDays.push(cursor);
      cursor = addDays(cursor, -1);
    }
  
    return { streak: streakDays.length, streakDays };
  }
  
  export function computeRewards(streak: number) {
    const crossesThisWeek = streak % 7;
    const fullWeeks = Math.floor(streak / 7);
  
    // كل 4 أسابيع = شهر
    const fullMonths = Math.floor(streak / 28);
  
    const threeMonths = streak >= 90;
    const sixMonths = streak >= 180;
    const year = streak >= 365;
  
    return { crossesThisWeek, fullWeeks, fullMonths, threeMonths, sixMonths, year };
  }
  