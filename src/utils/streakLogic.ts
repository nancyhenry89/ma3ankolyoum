// src/utils/streakLogic.ts

function pad(n: number) { return String(n).padStart(2, "0"); }

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * computeStreak (B-mode):
 * ✅ لو "اليوم" مش متعلم => streak = 0 (حتى لو كان أمس متعلم)
 * ✅ لو "اليوم" متعلم => احسب متتالي للخلف
 *    + اسمحي بعمل bridge مرة واحدة فقط لو:
 *      today ✓ ، yesterday ✗ ، twoDaysAgo ✓
 */
export function computeStreak(days: string[], todayISO: string) {
  const set = new Set(days);

  // ✅ المطلوب: 0 لحد ما يعلّم "اليوم"
  if (!set.has(todayISO)) {
    return { streak: 0, streakDays: [] as string[] };
  }

  const y = addDays(todayISO, -1);
  const d2 = addDays(todayISO, -2);

  const streakDays: string[] = [];
  let cursor = todayISO;
  let usedBridge = false;

  while (true) {
    if (set.has(cursor)) {
      streakDays.push(cursor);
      cursor = addDays(cursor, -1);
      continue;
    }

    // ✅ bridge يوم واحد فقط: تخطي "أمس" لو "أول امبارح" موجود
    if (!usedBridge && cursor === y && set.has(d2)) {
      usedBridge = true;
      cursor = addDays(cursor, -1); // skip yesterday -> go to twoDaysAgo
      continue;
    }

    break;
  }

  return { streak: streakDays.length, streakDays };
}
export function computeRewards(streak: number) {
  const crossesThisWeek = streak % 7;
  const fullWeeks = Math.floor(streak / 7);
  const fullMonths = Math.floor(streak / 28);

  return {
    crossesThisWeek,
    fullWeeks,
    fullMonths,
    threeMonths: streak >= 90,
    sixMonths: streak >= 180,
    year: streak >= 365,
  };
}