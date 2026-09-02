import { DailyVerse, DailyDevotional } from '../types';
import { getDeterministicDailyVerse } from '../data/dailyVerses';
import { scheduleNativeAndroidNotification } from './androidNotificationBridge';

export interface AppNotificationSettings {
  // 1. Daily Verse
  dailyVerseEnabled: boolean;
  dailyVerseTime: string; // "HH:mm", e.g. "07:00"

  // 2. Daily Devotional
  devotionalEnabled: boolean;
  devotionalTime: string; // "HH:mm", e.g. "08:00"

  // 3. Reading Plan Reminder
  readingPlanEnabled: boolean;
  readingPlanTime: string; // "HH:mm", e.g. "19:00"

  // 4. Prayer Reminder
  prayerReminderEnabled: boolean;
  prayerReminderTime: string; // "HH:mm", e.g. "21:00"

  // Tracking last triggered calendar dates (YYYY-MM-DD)
  lastNotifiedVotdDate?: string;
  lastNotifiedDevotionalDate?: string;
  lastNotifiedPlanDate?: string;
  lastNotifiedPrayerDate?: string;
}

// Backward compatibility alias
export type VotdNotificationSettings = {
  enabled: boolean;
  time: string;
  lastNotifiedDate?: string;
};

const STORAGE_KEY = 'hb_app_notification_settings';
const LEGACY_STORAGE_KEY = 'hb_votd_notification_settings';

export const DEFAULT_NOTIFICATION_SETTINGS: AppNotificationSettings = {
  dailyVerseEnabled: false,
  dailyVerseTime: '07:00',
  devotionalEnabled: false,
  devotionalTime: '08:00',
  readingPlanEnabled: false,
  readingPlanTime: '19:00',
  prayerReminderEnabled: false,
  prayerReminderTime: '21:00',
};

/**
 * Loads notification settings from localStorage (with fallback & legacy migration)
 */
export function getNotificationSettings(): AppNotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    }

    // Check legacy key if primary key not present
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      const migrated: AppNotificationSettings = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        dailyVerseEnabled: Boolean(parsedLegacy.enabled),
        dailyVerseTime: parsedLegacy.time || '07:00',
        lastNotifiedVotdDate: parsedLegacy.lastNotifiedDate,
      };
      saveNotificationSettings(migrated);
      return migrated;
    }

    return DEFAULT_NOTIFICATION_SETTINGS;
  } catch (err) {
    console.warn('Failed to load notification settings:', err);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Backward compatibility helper for legacy calls
 */
export function getVotdNotificationSettings(): VotdNotificationSettings {
  const s = getNotificationSettings();
  return {
    enabled: s.dailyVerseEnabled,
    time: s.dailyVerseTime,
    lastNotifiedDate: s.lastNotifiedVotdDate,
  };
}

type NotificationSettingsListener = (settings: AppNotificationSettings) => void;
const notificationListeners = new Set<NotificationSettingsListener>();

export function subscribeToNotificationSettings(listener: NotificationSettingsListener): () => void {
  notificationListeners.add(listener);
  return () => {
    notificationListeners.delete(listener);
  };
}

/**
 * Saves notification settings to localStorage
 */
export function saveNotificationSettings(settings: AppNotificationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Also update legacy key for backward compatibility
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({
        enabled: settings.dailyVerseEnabled,
        time: settings.dailyVerseTime,
        lastNotifiedDate: settings.lastNotifiedVotdDate,
      })
    );

    // Reschedule in-session timers and forward to native bridge
    scheduleAllNotifications();

    // Notify all active listeners
    notificationListeners.forEach(listener => {
      try {
        listener(settings);
      } catch (err) {
        console.warn('Listener error on notification settings change:', err);
      }
    });
  } catch (err) {
    console.warn('Failed to save notification settings:', err);
  }
}

/**
 * Backward compatibility helper for saving legacy VOTD settings
 */
export function saveVotdNotificationSettings(legacySettings: VotdNotificationSettings): void {
  const current = getNotificationSettings();
  const updated: AppNotificationSettings = {
    ...current,
    dailyVerseEnabled: legacySettings.enabled,
    dailyVerseTime: legacySettings.time,
    lastNotifiedVotdDate: legacySettings.lastNotifiedDate || current.lastNotifiedVotdDate,
  };
  saveNotificationSettings(updated);
}

/**
 * Requests browser notification permission and registers Service Worker
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register Service Worker if supported
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (swErr) {
          console.log('Service Worker registration non-critical note:', swErr);
        }
      }
      scheduleAllNotifications();
    }
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Helper to dispatch deep-linking event inside active web app
 */
export function dispatchNotificationDeepLink(tab: string, extraData?: any) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('hb_open_tab', {
      detail: { tab, ...extraData },
    })
  );
  // Also dispatch legacy hb_open_home if target is home
  if (tab === 'home') {
    window.dispatchEvent(new CustomEvent('hb_open_home'));
  }
}

/**
 * Dispatches a real system notification (via Service Worker or Notification constructor)
 */
export async function showSystemNotification(
  title: string,
  options: {
    body: string;
    tag: string;
    tab: 'home' | 'devotional' | 'plans' | 'prayer' | 'bible' | 'reader';
    extraData?: any;
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported in this browser.');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted.');
    return false;
  }

  const iconUrl = '/assets/holy-bible-plus-logo.png';

  // 1. Try Service Worker showNotification if active
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body: options.body,
          icon: iconUrl,
          badge: iconUrl,
          tag: options.tag,
          data: { tab: options.tab, ...options.extraData },
          renotify: true,
        } as any);
        return true;
      }
    } catch (swErr) {
      console.log('Falling back to standard Notification constructor:', swErr);
    }
  }

  // 2. Standard Web Notification API
  try {
    const notif = new Notification(title, {
      body: options.body,
      icon: iconUrl,
      tag: options.tag,
    });

    notif.onclick = () => {
      window.focus();
      dispatchNotificationDeepLink(options.tab, options.extraData);
    };

    return true;
  } catch (err) {
    console.warn('Failed to display browser notification:', err);
    return false;
  }
}

/**
 * Sends Daily Verse of the Day Notification
 */
export async function sendDailyVerseNotification(customVerse?: DailyVerse | null): Promise<boolean> {
  const verse = customVerse || getDeterministicDailyVerse(new Date());
  const title = 'Your Verse of the Day 📖';
  const body = `"${verse.text}" — ${verse.reference} (${verse.translation || 'WEB'})`;

  return showSystemNotification(title, {
    body,
    tag: 'hb_votd_daily',
    tab: 'home',
    extraData: { verse },
  });
}

/**
 * Sends Daily Devotional Notification
 */
export async function sendDevotionalNotification(devotional?: DailyDevotional | null): Promise<boolean> {
  const title = "Today's Devotional ✝️";
  const body = devotional
    ? `${devotional.title} — ${devotional.scripturalReference}`
    : "Take a quiet moment today to reflect on God's Word and pray.";

  return showSystemNotification(title, {
    body,
    tag: 'hb_devotional_daily',
    tab: 'devotional',
    extraData: { devotional },
  });
}

/**
 * Sends Reading Plan Reminder Notification
 */
export async function sendReadingPlanNotification(planTitle?: string, dayNumber?: number): Promise<boolean> {
  const title = 'Continue Your Bible Reading 📚';
  const body = planTitle && dayNumber
    ? `Day ${dayNumber} of "${planTitle}" is waiting for you today.`
    : 'Your daily Bible reading plan is waiting for you.';

  return showSystemNotification(title, {
    body,
    tag: 'hb_plan_reminder',
    tab: 'plans',
    extraData: { planTitle, dayNumber },
  });
}

/**
 * Sends Prayer Reminder Notification
 */
export async function sendPrayerReminderNotification(): Promise<boolean> {
  const title = 'Prayer Time 🙏';
  const body = 'Take a moment to pause, lay your cares before God, and intercede in prayer.';

  return showSystemNotification(title, {
    body,
    tag: 'hb_prayer_reminder',
    tab: 'prayer',
  });
}

// In-session active timeout IDs
const activeTimers: { [key: string]: ReturnType<typeof setTimeout> } = {};

function clearTimer(key: string) {
  if (activeTimers[key]) {
    clearTimeout(activeTimers[key]);
    delete activeTimers[key];
  }
}

/**
 * Schedules a daily in-session reminder for a given notification type
 */
function scheduleSingleNotification(
  typeKey: string,
  timeHHMM: string,
  onTrigger: () => Promise<boolean> | void,
  saveDateCallback: (dateStr: string) => void
) {
  clearTimer(typeKey);

  const [hour, minute] = timeHHMM.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hour || 0, minute || 0, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();

  activeTimers[typeKey] = setTimeout(async () => {
    await onTrigger();
    const todayStr = new Date().toISOString().slice(0, 10);
    saveDateCallback(todayStr);
    // Schedule for next day
    scheduleSingleNotification(typeKey, timeHHMM, onTrigger, saveDateCallback);
  }, delay);
}

/**
 * Master scheduler: schedules all active notifications (Daily Verse, Devotional, Plan, Prayer)
 * and bridges to native Android WorkManager/AlarmManager when running in Android APK/WebView.
 */
export function scheduleAllNotifications(): void {
  if (typeof window === 'undefined') return;

  const settings = getNotificationSettings();

  // 1. Daily Verse
  if (settings.dailyVerseEnabled) {
    const verse = getDeterministicDailyVerse(new Date());
    const [h, m] = settings.dailyVerseTime.split(':').map(Number);

    scheduleSingleNotification(
      'votd',
      settings.dailyVerseTime,
      () => sendDailyVerseNotification(verse),
      (dateStr) => {
        saveNotificationSettings({ ...getNotificationSettings(), lastNotifiedVotdDate: dateStr });
      }
    );

    // Forward to Native Android bridge
    scheduleNativeAndroidNotification({
      id: 'hb_votd_daily',
      type: 'votd',
      hour: h,
      minute: m,
      title: 'Your Verse of the Day 📖',
      body: `"${verse.text}" — ${verse.reference}`,
      deepLinkTab: 'home',
    });
  } else {
    clearTimer('votd');
  }

  // 2. Daily Devotional
  if (settings.devotionalEnabled) {
    const [h, m] = settings.devotionalTime.split(':').map(Number);

    scheduleSingleNotification(
      'devotional',
      settings.devotionalTime,
      () => sendDevotionalNotification(),
      (dateStr) => {
        saveNotificationSettings({ ...getNotificationSettings(), lastNotifiedDevotionalDate: dateStr });
      }
    );

    scheduleNativeAndroidNotification({
      id: 'hb_devotional_daily',
      type: 'devotional',
      hour: h,
      minute: m,
      title: "Today's Devotional ✝️",
      body: 'Quiet your heart and reflect on God’s Word today.',
      deepLinkTab: 'devotional',
    });
  } else {
    clearTimer('devotional');
  }

  // 3. Reading Plan
  if (settings.readingPlanEnabled) {
    const [h, m] = settings.readingPlanTime.split(':').map(Number);

    scheduleSingleNotification(
      'plan',
      settings.readingPlanTime,
      () => sendReadingPlanNotification(),
      (dateStr) => {
        saveNotificationSettings({ ...getNotificationSettings(), lastNotifiedPlanDate: dateStr });
      }
    );

    scheduleNativeAndroidNotification({
      id: 'hb_plan_reminder',
      type: 'plan',
      hour: h,
      minute: m,
      title: 'Continue Your Bible Reading 📚',
      body: 'Your daily Bible reading plan is ready.',
      deepLinkTab: 'plans',
    });
  } else {
    clearTimer('plan');
  }

  // 4. Prayer Reminder
  if (settings.prayerReminderEnabled) {
    const [h, m] = settings.prayerReminderTime.split(':').map(Number);

    scheduleSingleNotification(
      'prayer',
      settings.prayerReminderTime,
      () => sendPrayerReminderNotification(),
      (dateStr) => {
        saveNotificationSettings({ ...getNotificationSettings(), lastNotifiedPrayerDate: dateStr });
      }
    );

    scheduleNativeAndroidNotification({
      id: 'hb_prayer_reminder',
      type: 'prayer',
      hour: h,
      minute: m,
      title: 'Prayer Time 🙏',
      body: 'Take a moment to pause, thank God, and pray.',
      deepLinkTab: 'prayer',
    });
  } else {
    clearTimer('prayer');
  }
}

// Backward compatibility function
export function scheduleNextVotdNotification(verse?: DailyVerse | null): void {
  scheduleAllNotifications();
}
