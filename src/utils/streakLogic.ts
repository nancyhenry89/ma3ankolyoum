function toTime(iso: string) {
    return new Date(`${iso}T00:00:00`).getTime()
  }
  
  function addDays(iso: string, n: number) {
    const d = new Date(`${iso}T00:00:00`)
    d.setDate(d.getDate() + n)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  
  export function computeStreak(days: string[], todayISO: string) {
    const set = new Set(days)
    // streak يعتبر متصل لو اليوم موجود أو أمس موجود (لو لسه ما قراش النهارده)
    let startISO = todayISO
    if (!set.has(todayISO) && set.has(addDays(todayISO, -1))) {
      startISO = addDays(todayISO, -1)
    } else if (!set.has(todayISO)) {
      return { streak: 0, streakDays: [] as string[] }
    }
  
    const streakDays: string[] = []
    let cursor = startISO
    while (set.has(cursor)) {
      streakDays.push(cursor)
      cursor = addDays(cursor, -1)
    }
  
    return { streak: streakDays.length, streakDays }
  }
  
  export function computeRewards(streak: number) {
    const crossesThisWeek = streak % 7
    const fullWeeks = Math.floor(streak / 7)
  
    const fullMonths = Math.floor(streak / 28) // بسيط (4 أسابيع)
    const threeMonths = streak >= 90
    const sixMonths = streak >= 180
    const year = streak >= 365
  
    return {
      crossesThisWeek,
      fullWeeks,
      fullMonths,
      threeMonths,
      sixMonths,
      year,
      streak,
      brokenYesterday: true,
      canRecover: true
    }
  }
  