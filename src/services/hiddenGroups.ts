
import { ensureAnonAuth } from '@/lib/firebase'
import { getIdToken } from 'firebase/auth'

export async function getHiddenGroupsAuthToken(): Promise<string> {
  const user = await ensureAnonAuth()

  if (!user) {
    throw new Error('Firebase authentication failed')
  }

  return getIdToken(user)
}
