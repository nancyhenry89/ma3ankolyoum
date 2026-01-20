// src/services/habitCounts.ts
import { db } from '@/lib/firebase'
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  collection,
  getDoc
} from 'firebase/firestore'

export type HabitCountKey = 'morning' | 'bible' | 'sleep' | 'communion' | 'confession'

function getAnonId() {
  const key = 'mk_anon_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(key, id)
  }
  return id
}

function countDocId(dateISO: string, key: HabitCountKey) {
  return `${dateISO}_${key}`
}

/**
 * Listen to counts for today's habits
 * Returns an unsubscribe function
 */
export function listenTodayHabitCounts(
  dateISO: string,
  keys: HabitCountKey[],
  cb: (counts: Partial<Record<HabitCountKey, number>>) => void
) {
  const unsubs: Array<() => void> = []
  const state: Partial<Record<HabitCountKey, number>> = {}

  keys.forEach((k) => {
    const ref = doc(db, 'habit_counts', countDocId(dateISO, k))
    const u = onSnapshot(ref, (snap) => {
      const data = (snap.data() || {}) as any
      state[k] = Number(data.count || 0)
      cb({ ...state })
    })
    unsubs.push(u)
  })

  return () => unsubs.forEach((u) => u())
}

/**
 * Set today's habit state for THIS anon user:
 * done=true  => ensure counted
 * done=false => ensure uncounted
 *
 * Uses:
 * habit_counts/{date_key} {count, date, key}
 * habit_counts/{date_key}/voters/{anonId} {active:true}
 */
export async function setTodayHabitState(dateISO: string, key: HabitCountKey, done: boolean) {
  const anonId = getAnonId()

  const cRef = doc(db, 'habit_counts', countDocId(dateISO, key))
  const vRef = doc(collection(cRef, 'voters'), anonId)

  await runTransaction(db, async (tx) => {
    const vSnap = await tx.get(vRef)
    const had = vSnap.exists()

    // read count
    const cSnap = await tx.get(cRef)
    const cData = (cSnap.exists() ? cSnap.data() : {}) as any
    const cur = Number(cData.count || 0)

    if (done) {
      // want counted
      if (!had) {
        tx.set(vRef, { active: true, updatedAt: serverTimestamp() }, { merge: true })
        tx.set(
          cRef,
          {
            date: dateISO,
            key,
            count: cur + 1,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } else {
        // already counted -> ensure parent doc exists
        tx.set(
          cRef,
          { date: dateISO, key, updatedAt: serverTimestamp() },
          { merge: true }
        )
      }
    } else {
      // want uncounted
      if (had) {
        tx.delete(vRef)
        tx.set(
          cRef,
          {
            date: dateISO,
            key,
            count: Math.max(0, cur - 1),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } else {
        // already not counted -> ensure parent doc exists
        tx.set(
          cRef,
          { date: dateISO, key, updatedAt: serverTimestamp() },
          { merge: true }
        )
      }
    }
  })
}

/**
 * Arabic people text:
 * - 1: "✨ شخص صلّى باكر النهارده"
 * - 2: "✨ شخصين صلّوا باكر النهارده"
 * - 3+: "✨ 3 أشخاص صلّوا باكر النهارده"
 */
// ✅ Arabic text with correct grammar + number at the END for 3+
export function peopleTextHabitAr(key: HabitCountKey, n: number) {
    const p = habitPhraseAr(key)
  
    // اتجاه RTL ثابت
    const RLM = '\u200F' // Right-to-left mark
    const LRM = '\u200E' // Left-to-right mark (للأرقام)
  
    if (n === 1) return `${RLM}✨ شخص ${p.one}`
    if (n === 2) return `${RLM}✨ شخصين ${p.two}`
    
    // ✅ لو أكتر من 10 -> شخص
    if (n > 10) {
      return `${RLM}✨ ${LRM}${n}${RLM} شخص ${p.many}`
    }
    
    // ✅ من 3 لـ 10 -> أشخاص
    return `${RLM}✨ ${LRM}${n}${RLM} أشخاص ${p.many}`
  }
  
  function habitPhraseAr(key: HabitCountKey): { one: string; two: string; many: string } {
    switch (key) {
      case 'morning':
        return { one: 'صلّى باكر النهارده', two: 'صلّوا باكر النهارده', many: 'صلّوا باكر النهارده' }
      case 'sleep':
        return { one: 'صلّى صلاة النوم النهارده', two: 'صلّوا صلاة النوم النهارده', many: 'صلّوا صلاة النوم النهارده' }
      case 'bible':
        return { one: 'قرأ الكتاب المقدس النهارده', two: 'قرأوا الكتاب المقدس النهارده', many: 'قرأوا الكتاب المقدس النهارده' }
      case 'communion':
        return { one: 'اتناول النهارده', two: 'اتناولوا النهارده', many: 'اتناولوا النهارده' }
      case 'confession':
        return { one: 'اعترف النهارده', two: 'اعترفوا النهارده', many: 'اعترفوا النهارده' }
    }
    
  }
  
  export function peopleTextHabitEn(key: HabitCountKey, n: number) {
    const label = habitLabelEn(key)
  
    if (n === 1) return `✨ 1 person ${label} today`
    return `✨ ${n} people ${label} today`
  }
  
  function habitLabelEn(key: HabitCountKey) {
    switch (key) {
      case 'morning':
        return 'prayed Morning Prayer'
      case 'bible':
        return 'read the Bible'
      case 'sleep':
        return 'prayed Night Prayer'
      case 'communion':
        return 'took Communion'
      case 'confession':
        return 'went to Confession'
    }
  }
  
  // ✅ helper (اختياري لكن أنضف)
  export function peopleTextHabit(key: HabitCountKey, n: number, lang: 'ar' | 'en') {
    return lang === 'ar' ? peopleTextHabitAr(key, n) : peopleTextHabitEn(key, n)
  }
  