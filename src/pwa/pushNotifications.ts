/**
 * Web Push Notification Service Architecture
 * Ready for future backend web-push / VAPID key integration.
 * Categories:
 * - achievement_approved (اعتماد إنجاز الطالب)
 * - teacher_message (رسالة من المعلم)
 * - new_certificate (شهادة جديدة)
 * - school_alert (تنبيه من المدرسة)
 * - homework_or_deadline (موعد أو واجب)
 * - talent_nomination (ترشيح للتميز أو الموهبة)
 */

export type PushNotificationCategory =
  | 'achievement_approved'
  | 'teacher_message'
  | 'new_certificate'
  | 'school_alert'
  | 'homework_or_deadline'
  | 'talent_nomination';

export interface PushNotificationPayload {
  category: PushNotificationCategory;
  title: string;
  body: string;
  data?: {
    schoolId?: string;
    studentId?: string;
    achievementId?: string;
    targetTab?: string;
    url?: string;
  };
}

export class PushNotificationService {
  /**
   * Check if Web Push is supported by the current browser/device
   */
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Current notification permission state: 'default' | 'granted' | 'denied'
   */
  static getPermissionState(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request push permission from user
   */
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.warn('[Push Service] Permission request failed:', err);
      return false;
    }
  }

  /**
   * Get existing Push Subscription or register with VAPID public key
   */
  static async subscribeUser(vapidPublicKey?: string): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;
    if (Notification.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription && vapidPublicKey) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      return subscription;
    } catch (err) {
      console.warn('[Push Service] Subscribe error:', err);
      return null;
    }
  }

  /**
   * Convert VAPID key helper
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
