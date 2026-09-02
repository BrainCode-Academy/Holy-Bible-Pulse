/**
 * Holy Bible+ Android Native Notification Bridge
 * 
 * This module handles bidirectional communication between the Holy Bible+ web app
 * and native Android runtime environments (Android WebView, Capacitor, TWA, or React Native).
 * 
 * In Android packaging:
 * - The native Android layer injects `window.AndroidNotificationBridge` or uses Capacitor LocalNotifications.
 * - Schedules exact background alarms using Android WorkManager / AlarmManager (setExactAndAllowWhileIdle).
 * - Fires NotificationCompat.Builder notifications with PendingIntents that launch Holy Bible+ directly
 *   into the deep linked tab (e.g. `intent://holybibleplus.app/votd` or `/?tab=home`).
 */

export interface NativeAndroidScheduleRequest {
  id: string;              // Unique identifier (e.g., 'votd_daily', 'devotional_daily')
  type: 'votd' | 'devotional' | 'plan' | 'prayer';
  hour: number;            // 0..23 local hour
  minute: number;          // 0..59 local minute
  title: string;           // Notification Title
  body: string;            // Notification Body text
  deepLinkTab: string;     // Target tab ('home', 'devotional', 'plans', 'prayer')
  iconResName?: string;    // Android drawable name (e.g., 'ic_stat_holy_bible')
}

export interface AndroidBridgeStatus {
  isNativeAndroid: boolean;
  platformName: string;
  hasBackgroundExactAlarmPermission: boolean;
  bridgeVersion: string;
  supportedFeatures: string[];
}

declare global {
  interface Window {
    AndroidNotificationBridge?: {
      scheduleDailyNotification?: (jsonString: string) => boolean;
      cancelDailyNotification?: (id: string) => boolean;
      requestNotificationPermission?: () => string;
      checkNotificationPermission?: () => string;
      isExactAlarmAllowed?: () => boolean;
      getBridgeVersion?: () => string;
    };
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
      Plugins?: {
        LocalNotifications?: {
          schedule: (options: any) => Promise<any>;
          requestPermissions: () => Promise<{ display: string }>;
          cancel: (options: { notifications: { id: number }[] }) => Promise<any>;
        };
      };
    };
  }
}

/**
 * Checks if the current app is running inside a native Android container
 */
export function isRunningInNativeAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.AndroidNotificationBridge ||
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    /Android/i.test(navigator.userAgent) && /wv|WebView/i.test(navigator.userAgent)
  );
}

/**
 * Returns comprehensive bridge status
 */
export function getAndroidBridgeStatus(): AndroidBridgeStatus {
  if (typeof window === 'undefined') {
    return {
      isNativeAndroid: false,
      platformName: 'Server / SSR',
      hasBackgroundExactAlarmPermission: false,
      bridgeVersion: 'none',
      supportedFeatures: [],
    };
  }

  const isNative = isRunningInNativeAndroid();
  let platformName = 'Web Browser (PWA/Chrome)';
  let bridgeVersion = 'Web-V1';
  let hasExactAlarm = false;

  if (window.AndroidNotificationBridge) {
    platformName = 'Native Android (WebView Bridge)';
    bridgeVersion = window.AndroidNotificationBridge.getBridgeVersion ? window.AndroidNotificationBridge.getBridgeVersion() : 'AndroidBridge-1.0';
    hasExactAlarm = window.AndroidNotificationBridge.isExactAlarmAllowed ? window.AndroidNotificationBridge.isExactAlarmAllowed() : true;
  } else if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    platformName = 'Native Android (Capacitor)';
    bridgeVersion = 'Capacitor-Plugin-1.0';
    hasExactAlarm = true;
  }

  return {
    isNativeAndroid: isNative,
    platformName,
    hasBackgroundExactAlarmPermission: hasExactAlarm,
    bridgeVersion,
    supportedFeatures: [
      'Daily Verse Alarm',
      'Daily Devotional Alarm',
      'Reading Plan Reminder',
      'Prayer Reminder',
      'Deep Link Navigation',
      isNative ? 'Background AlarmManager (Closed App)' : 'In-Session Scheduled Worker',
    ],
  };
}

/**
 * Forwards schedule request to native Android bridge if present
 */
export function scheduleNativeAndroidNotification(req: NativeAndroidScheduleRequest): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // 1. Android Java / Kotlin @JavascriptInterface Bridge
    if (window.AndroidNotificationBridge && window.AndroidNotificationBridge.scheduleDailyNotification) {
      const payload = JSON.stringify(req);
      const success = window.AndroidNotificationBridge.scheduleDailyNotification(payload);
      console.log('[AndroidBridge] Dispatched schedule to Native Android:', success, req);
      return success;
    }

    // 2. Capacitor LocalNotifications plugin fallback
    if (window.Capacitor?.Plugins?.LocalNotifications) {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(req.hour, req.minute, 0, 0);
      if (scheduledTime.getTime() <= now.getTime()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const numericId = Math.abs(req.id.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 100000;

      window.Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [
          {
            id: numericId,
            title: req.title,
            body: req.body,
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'day',
            },
            extra: {
              tab: req.deepLinkTab,
              type: req.type,
            },
            smallIcon: 'ic_stat_holy_bible',
            iconColor: '#d97706',
          }
        ]
      }).catch((err: any) => console.error('[CapacitorNotifications] Schedule error:', err));

      return true;
    }

    // In web mode, return false to let web notification service handle it
    return false;
  } catch (err) {
    console.error('[AndroidBridge] Failed to forward schedule to native Android:', err);
    return false;
  }
}

/**
 * Cancels a scheduled native alarm by ID
 */
export function cancelNativeAndroidNotification(id: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (window.AndroidNotificationBridge && window.AndroidNotificationBridge.cancelDailyNotification) {
      return window.AndroidNotificationBridge.cancelDailyNotification(id);
    }

    if (window.Capacitor?.Plugins?.LocalNotifications) {
      const numericId = Math.abs(id.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 100000;
      window.Capacitor.Plugins.LocalNotifications.cancel({
        notifications: [{ id: numericId }]
      }).catch(console.error);
      return true;
    }

    return false;
  } catch (err) {
    console.error('[AndroidBridge] Failed to cancel native Android alarm:', err);
    return false;
  }
}
