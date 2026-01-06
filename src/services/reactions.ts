// src/services/reactions.ts
import { db } from '@/lib/firebase'

import { doc, getDoc, runTransaction, onSnapshot } from 'firebase/firestore'

type ReactionKey = 'heart'

function getAnonId() {
  const key = 'mk_anon_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(key, id)
  }
  return id
}

export function listenReactions(itemId: string, cb: (counts: Record<string, number>) => void) {
  const ref = doc(db, 'reactions', itemId)
  return onSnapshot(ref, snap => {
    const data = snap.data() as any
    cb(data?.counts || { heart: 0 })
  })
}

export async function toggleHeart(itemId: string) {
  const anonId = getAnonId()
  const ref = doc(db, 'reactions', itemId)

  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    const data = (snap.exists() ? snap.data() : {}) as any

    const counts = { ...(data.counts || {}) }
    const voters = { ...(data.voters || {}) }

    const already = !!voters[anonId]

    if (already) {
      // un-heart
      voters[anonId] = false
      counts.heart = Math.max(0, Number(counts.heart || 0) - 1)
    } else {
      voters[anonId] = true
      counts.heart = Number(counts.heart || 0) + 1
    }

    tx.set(ref, { counts, voters }, { merge: true })
  })
}
