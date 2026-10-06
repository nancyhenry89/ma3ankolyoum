import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, ensureAnonAuth } from '@/lib/firebase'
let initialized = false
async function savePushToken(token: string) {
    try {
      const user = await ensureAnonAuth()
  
      if (!user) {
        console.error('[PUSH] Could not authenticate device')
        return
      }
  
      await setDoc(
        doc(db, 'pushTokens', token),
        {
          token,
          uid: user.uid,
          platform: Capacitor.getPlatform(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
  
      console.log('[PUSH] Token saved to Firestore')
    } catch (error) {
      console.error('[PUSH] Failed to save token:', error)
    }
  }
export async function initPushNotifications() {
  // Push notifications only work in native Android/iOS app
  if (!Capacitor.isNativePlatform()) {
    console.log('[PUSH] Not running on native platform')
    return
  }

  if (initialized) return
  initialized = true

  // =========================
  // TOKEN RECEIVED
  // =========================
  await PushNotifications.addListener(
    'registration',
    async token => {
      console.log('[PUSH] Registration token:', token.value)
  
      await savePushToken(token.value)
    }
  )

  // =========================
  // REGISTRATION ERROR
  // =========================
  await PushNotifications.addListener(
    'pushNotificationReceived',
    notification => {
      console.log('[PUSH] Notification received:', notification)
  
      window.dispatchEvent(
        new CustomEvent('push-announcement', {
          detail: {
            title: notification.title || 'معًا كل يوم',
            message: notification.body || '',
            data: notification.data || {}
          }
        })
      )
    }
  )

  // =========================
  // NOTIFICATION RECEIVED
  // while app is open
  // =========================
  await PushNotifications.addListener(
    'pushNotificationReceived',
    notification => {
      console.log(
        '[PUSH] Notification received:',
        notification
      )
    }
  )

  // =========================
  // USER TAPPED NOTIFICATION
  // =========================
  await PushNotifications.addListener(
    'pushNotificationActionPerformed',
    action => {
      console.log(
        '[PUSH] Notification tapped:',
        action.notification
      )

      // Later we'll use:
      // action.notification.data
      //
      // to open the announcements page.
    }
  )

  // =========================
  // PERMISSION
  // =========================

  let permission =
    await PushNotifications.checkPermissions()

  if (permission.receive === 'prompt') {
    permission =
      await PushNotifications.requestPermissions()
  }

  if (permission.receive !== 'granted') {
    console.warn(
      '[PUSH] Notification permission not granted'
    )
    return
  }

  // =========================
  // REGISTER WITH FCM/APNS
  // =========================

  await PushNotifications.register()

  console.log('[PUSH] Registration requested')
}