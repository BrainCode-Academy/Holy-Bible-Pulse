import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  X,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  BookOpen,
  Flame,
  Calendar,
  Heart,
  Smartphone,
  Check,
  ChevronRight,
  Info,
  Timer,
  Sun,
  Coffee,
  Sunset,
  Moon,
} from 'lucide-react';
import {
  AppNotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  sendDailyVerseNotification,
  sendDevotionalNotification,
  sendReadingPlanNotification,
  sendPrayerReminderNotification,
  sendMorningGreetingNotification,
  sendAfternoonGreetingNotification,
  sendEveningGreetingNotification,
  sendNightGreetingNotification,
  scheduleAllNotifications,
} from '../../services/notificationService';
import { getAndroidBridgeStatus } from '../../services/androidNotificationBridge';
import { useBible } from '../../context/BibleContext';
import { DailyVerse } from '../../types';

interface VotdNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verseOfDay?: DailyVerse | null;
}

export const VotdNotificationModal: React.FC<VotdNotificationModalProps> = ({
  isOpen,
  onClose,
  verseOfDay,
}) => {
  const { readerSettings, activeTab, plans, devotional } = useBible();
  const [settings, setSettings] = useState<AppNotificationSettings>(getNotificationSettings);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [activeSubTab, setActiveSubTab] = useState<'reminders' | 'greetings' | 'testing' | 'android'>('greetings');
  
  // Testing state
  const [testType, setTestType] = useState<'morning' | 'afternoon' | 'evening' | 'night' | 'votd' | 'devotional' | 'plan' | 'prayer'>('morning');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  useEffect(() => {
    if (isOpen) {
      setSettings(getNotificationSettings());
      if ('Notification' in window) {
        setPermissionState(Notification.permission);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const bridgeStatus = getAndroidBridgeStatus();

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionState(res);
    if (res === 'granted') {
      setTestStatus('Notification permission granted! Reminders are active.');
      setTimeout(() => setTestStatus(null), 3500);
    } else if (res === 'denied') {
      setTestStatus('Notifications were denied. Please enable them in browser settings.');
    }
  };

  const updateField = async <K extends keyof AppNotificationSettings>(
    key: K,
    value: AppNotificationSettings[K]
  ) => {
    // If enabling a feature and permission not granted, request it first
    if (typeof value === 'boolean' && value === true && permissionState !== 'granted') {
      const res = await requestNotificationPermission();
      setPermissionState(res);
      if (res !== 'granted') {
        setTestStatus('Permission is required to receive daily alerts.');
        return;
      }
    }

    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveNotificationSettings(updated);
  };

  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return '7:00 AM';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const displayMin = m < 10 ? `0${m}` : m;
    return `${displayHour}:${displayMin} ${period}`;
  };

  // Instant test notification trigger
  const handleTriggerInstantTest = async () => {
    if (permissionState !== 'granted') {
      const res = await requestNotificationPermission();
      setPermissionState(res);
      if (res !== 'granted') {
        setTestStatus('Permission is required to test notifications.');
        return;
      }
    }

    let success = false;
    if (testType === 'morning') {
      success = await sendMorningGreetingNotification();
    } else if (testType === 'afternoon') {
      success = await sendAfternoonGreetingNotification();
    } else if (testType === 'evening') {
      success = await sendEveningGreetingNotification();
    } else if (testType === 'night') {
      success = await sendNightGreetingNotification();
    } else if (testType === 'votd') {
      success = await sendDailyVerseNotification(verseOfDay);
    } else if (testType === 'devotional') {
      success = await sendDevotionalNotification();
    } else if (testType === 'plan') {
      const enrolled = plans.find(p => p.enrolled) || plans[0];
      success = await sendReadingPlanNotification(enrolled?.title, enrolled?.currentDay);
    } else if (testType === 'prayer') {
      success = await sendPrayerReminderNotification();
    }

    if (success) {
      setTestStatus(`Test ${testType.toUpperCase()} notification sent to your system tray!`);
      setTimeout(() => setTestStatus(null), 4000);
    } else {
      setTestStatus('Check your browser permission settings.');
    }
  };

  // 5-second delayed test notification trigger
  const handleSchedule5SecTest = async () => {
    if (permissionState !== 'granted') {
      const res = await requestNotificationPermission();
      setPermissionState(res);
      if (res !== 'granted') {
        setTestStatus('Permission is required to test notifications.');
        return;
      }
    }

    setCountdown(5);
    setTestStatus('Test notification scheduled in 5 seconds. You may minimize or switch tabs now!');

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleTriggerInstantTest();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const modalBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-amber-100 text-stone-900';

  const cardInnerBg = isDark
    ? 'bg-stone-800/60 border-stone-700/60'
    : isSepia
    ? 'bg-[#eae0c6]/60 border-[#d9ccb0]'
    : 'bg-stone-50 border-stone-200/80';

  const subText = isDark
    ? 'text-stone-400'
    : isSepia
    ? 'text-[#7a644e]'
    : 'text-stone-500';

  const timePresets = [
    { label: '6:00 AM', value: '06:00' },
    { label: '7:00 AM', value: '07:00' },
    { label: '8:00 AM', value: '08:00' },
    { label: '9:00 AM', value: '09:00' },
  ];

  return (
    <div
      id="notification-settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="notification-settings-modal-dialog"
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${modalBg} flex flex-col max-h-[90vh]`}
      >
        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg leading-tight">Daily Notifications &amp; Reminders</h2>
              <p className={`text-xs ${subText}`}>Greetings, Scripture reminders, and prayer alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="close-notification-modal-btn"
            className="p-2 rounded-xl hover:bg-stone-500/10 text-stone-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 pt-3 pb-1 border-b border-stone-200/40 dark:border-stone-800/60 flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('greetings')}
            id="notif-tab-greetings"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'greetings'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Daily Greetings
          </button>

          <button
            onClick={() => setActiveSubTab('reminders')}
            id="notif-tab-reminders"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'reminders'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Bible &amp; Prayer
          </button>

          <button
            onClick={() => setActiveSubTab('testing')}
            id="notif-tab-testing"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 whitespace-nowrap ${
              activeSubTab === 'testing'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Alerts</span>
          </button>

          <button
            onClick={() => setActiveSubTab('android')}
            id="notif-tab-android"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 whitespace-nowrap ${
              activeSubTab === 'android'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Status Message Banner */}
          {testStatus && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{testStatus}</span>
            </div>
          )}

          {/* Permission Status Banner */}
          {permissionState !== 'granted' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
                    {permissionState === 'denied'
                      ? 'Browser Notifications Blocked'
                      : 'Notifications Permission Needed'}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {permissionState}
                </span>
              </div>

              <p className={`text-xs ${subText}`}>
                {permissionState === 'denied'
                  ? 'Notifications are blocked in your browser site permissions. Click the lock/info icon in your browser URL bar to allow notifications for this site.'
                  : 'Enable notifications to receive daily Greetings, Scripture verses, devotional reflections, and reading reminders.'}
              </p>

              {permissionState !== 'denied' && (
                <button
                  onClick={handleRequestPermission}
                  id="enable-notification-permission-btn"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center space-x-2 transition"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Notifications</span>
                </button>
              )}
            </div>
          )}

          {/* TAB: GREETINGS */}
          {activeSubTab === 'greetings' && (
            <div className="space-y-3">
              <p className={`text-xs ${subText}`}>
                Receive uplifting greetings aligned with your local 4-part daily cycle:
              </p>

              {/* 1. Good Morning */}
              <div className={`p-4 rounded-2xl border ${cardInnerBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider">Good Morning Greeting</div>
                      <div className={`text-[11px] ${subText}`}>Morning peace &amp; Lamentations 3:22-23</div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateField('morningGreetingEnabled', !settings.morningGreetingEnabled)}
                    id="toggle-morning-greeting-btn"
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.morningGreetingEnabled
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {settings.morningGreetingEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {settings.morningGreetingEnabled && (
                  <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-xs animate-fadeIn">
                    <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Custom Morning Time:</span>
                    </span>
                    <input
                      type="time"
                      value={settings.morningGreetingTime}
                      onChange={e => updateField('morningGreetingTime', e.target.value)}
                      className="p-1.5 rounded-xl border bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* 2. Good Afternoon */}
              <div className={`p-4 rounded-2xl border ${cardInnerBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider">Good Afternoon Greeting</div>
                      <div className={`text-[11px] ${subText}`}>Midday encouragement &amp; Psalm 23</div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateField('afternoonGreetingEnabled', !settings.afternoonGreetingEnabled)}
                    id="toggle-afternoon-greeting-btn"
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.afternoonGreetingEnabled
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {settings.afternoonGreetingEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {settings.afternoonGreetingEnabled && (
                  <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-xs animate-fadeIn">
                    <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Custom Afternoon Time:</span>
                    </span>
                    <input
                      type="time"
                      value={settings.afternoonGreetingTime}
                      onChange={e => updateField('afternoonGreetingTime', e.target.value)}
                      className="p-1.5 rounded-xl border bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* 3. Good Evening */}
              <div className={`p-4 rounded-2xl border ${cardInnerBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Sunset className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider">Good Evening Greeting</div>
                      <div className={`text-[11px] ${subText}`}>Evening meditation &amp; John 14:27</div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateField('eveningGreetingEnabled', !settings.eveningGreetingEnabled)}
                    id="toggle-evening-greeting-btn"
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.eveningGreetingEnabled
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {settings.eveningGreetingEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {settings.eveningGreetingEnabled && (
                  <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-xs animate-fadeIn">
                    <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Custom Evening Time:</span>
                    </span>
                    <input
                      type="time"
                      value={settings.eveningGreetingTime}
                      onChange={e => updateField('eveningGreetingTime', e.target.value)}
                      className="p-1.5 rounded-xl border bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* 4. Good Night */}
              <div className={`p-4 rounded-2xl border ${cardInnerBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider">Good Night Greeting</div>
                      <div className={`text-[11px] ${subText}`}>Peaceful sleep &amp; Psalm 4:8</div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateField('nightGreetingEnabled', !settings.nightGreetingEnabled)}
                    id="toggle-night-greeting-btn"
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.nightGreetingEnabled
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {settings.nightGreetingEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {settings.nightGreetingEnabled && (
                  <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-xs animate-fadeIn">
                    <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Custom Night Time:</span>
                    </span>
                    <input
                      type="time"
                      value={settings.nightGreetingTime}
                      onChange={e => updateField('nightGreetingTime', e.target.value)}
                      className="p-1.5 rounded-xl border bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REMINDERS & SCHEDULES */}
          {activeSubTab === 'reminders' && (
            <div className="space-y-4">
              {/* 1. Daily Verse */}
              <div className={`p-4 rounded-2xl border ${cardInnerBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider">Verse of the Day</div>
                      <div className={`text-[11px] ${subText}`}>
                        Delivers today's featured Scripture every morning
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateField('dailyVerseEnabled', !settings.dailyVerseEnabled)}
                    id="toggle-votd-notif-btn"
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.dailyVerseEnabled
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {settings.dailyVerseEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {settings.dailyVerseEnabled && (
                  <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Delivery Time:</span>
                      </span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {formatTimeDisplay(settings.dailyVerseTime)}
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {timePresets.map(preset => (
                        <button
                          key={preset.value}
                          onClick={() => updateField('dailyVerseTime', preset.value)}
                          className={`py-1.5 rounded-xl border text-xs font-semibold transition ${
                            settings.dailyVerseTime === preset.value
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Time Selector */}
                    <div className="flex items-center space-x-2 pt-1">
                      <span className={`text-[11px] ${subText}`}>Custom Time:</span>
                      <input
                        type="time"
                        value={settings.dailyVerseTime}
                        onChange={e => updateField('dailyVerseTime', e.target.value)}
                        className="p-1.5 rounded-xl border bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Daily Devotional */}
              <div className={`p-4 rounded-2xl border ${cardInnerBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider">Daily Devotional</div>
                      <div className={`text-[11px] ${subText}`}>
                        Morning spiritual reflections and guided prayer
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateField('devotionalEnabled', !settings.devotionalEnabled)}
                    id="toggle-devotional-notif-btn"
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.devotionalEnabled
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {settings.devotionalEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {settings.devotionalEnabled && (
                  <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-xs animate-fadeIn">
                    <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Delivery Time:</span>
                    </span>
                    <input
                      type="time"
                      value={settings.devotionalTime}
                      onChange={e => updateField('devotionalTime', e.target.value)}
                      className="p-1.5 rounded-xl border bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* 3. Reading Plan Reminder */}
              <div className={`p-4 rounded-2xl border ${cardInnerBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider">Reading Plan Reminder</div>
                      <div className={`text-[11px] ${subText}`}>
                        Evening reminder to complete your daily chapters
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateField('readingPlanEnabled', !settings.readingPlanEnabled)}
                    id="toggle-plan-notif-btn"
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.readingPlanEnabled
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {settings.readingPlanEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {settings.readingPlanEnabled && (
                  <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-xs animate-fadeIn">
                    <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Delivery Time:</span>
                    </span>
                    <input
                      type="time"
                      value={settings.readingPlanTime}
                      onChange={e => updateField('readingPlanTime', e.target.value)}
                      className="p-1.5 rounded-xl border bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* 4. Prayer Reminder */}
              <div className={`p-4 rounded-2xl border ${cardInnerBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider">Prayer Time Reminder</div>
                      <div className={`text-[11px] ${subText}`}>
                        Quiet night reflection to bring your petitions to God
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateField('prayerReminderEnabled', !settings.prayerReminderEnabled)}
                    id="toggle-prayer-notif-btn"
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      settings.prayerReminderEnabled
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {settings.prayerReminderEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {settings.prayerReminderEnabled && (
                  <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-xs animate-fadeIn">
                    <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Delivery Time:</span>
                    </span>
                    <input
                      type="time"
                      value={settings.prayerReminderTime}
                      onChange={e => updateField('prayerReminderTime', e.target.value)}
                      className="p-1.5 rounded-xl border bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DEVELOPMENT & TESTING TOOLS */}
          {activeSubTab === 'testing' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${cardInnerBg} space-y-3`}>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Instant Notification Test Lab
                  </span>
                </div>

                <p className={`text-xs leading-relaxed ${subText}`}>
                  Test notifications immediately without waiting for scheduled times.
                  Verify system banners, sound, vibration, and deep-link navigation.
                </p>

                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    Select Notification To Test:
                  </label>
                  <select
                    value={testType}
                    onChange={e => setTestType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="morning">☀️ Good Morning Greeting</option>
                    <option value="afternoon">☕ Good Afternoon Greeting</option>
                    <option value="evening">🌅 Good Evening Greeting</option>
                    <option value="night">🌙 Good Night Greeting</option>
                    <option value="votd">📖 Verse of the Day</option>
                    <option value="devotional">✝️ Daily Devotional</option>
                    <option value="plan">📚 Reading Plan Reminder</option>
                    <option value="prayer">🙏 Prayer Time Reminder</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleTriggerInstantTest}
                    id="send-instant-test-btn"
                    className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center space-x-1.5 transition active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Now</span>
                  </button>

                  <button
                    onClick={handleSchedule5SecTest}
                    id="schedule-5sec-test-btn"
                    disabled={countdown !== null}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 ${
                      countdown !== null
                        ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 animate-pulse'
                        : 'bg-stone-200/80 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-600'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>{countdown !== null ? `Firing in ${countdown}s...` : 'Test in 5 Seconds'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NATIVE ANDROID ARCHITECTURE */}
          {activeSubTab === 'android' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${cardInnerBg} space-y-3`}>
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Android Native Notification System
                  </span>
                </div>

                <p className={`text-xs leading-relaxed ${subText}`}>
                  Holy Bible+ uses an enterprise-grade notification architecture designed for background reliability on Android devices.
                </p>

                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Platform Runtime:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{bridgeStatus.platformName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Bridge Interface:</span>
                    <span className="font-mono text-[11px]">{bridgeStatus.bridgeVersion}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Alarm Manager Ready:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-stone-700 dark:text-stone-300">How Background Alarms Work:</div>
                  <ul className="space-y-1 text-[11px] text-stone-600 dark:text-stone-400 list-disc list-inside">
                    <li><strong className="text-stone-800 dark:text-stone-200">WorkManager &amp; AlarmManager:</strong> Fires exact background reminders at your selected morning/afternoon/evening/night hours, even when the Holy Bible+ app is completely closed.</li>
                    <li><strong className="text-stone-800 dark:text-stone-200">Device Local Timezone:</strong> Times are scheduled in your phone's local time, adjusting automatically for Daylight Saving Time.</li>
                    <li><strong className="text-stone-800 dark:text-stone-200">Deep Link Navigation:</strong> Tapping the alert opens directly into the Verse of the Day, Devotional, or Reading Plan.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
          <span className={`text-[11px] ${subText}`}>
            Changes save automatically
          </span>

          <button
            onClick={onClose}
            id="done-notification-modal-btn"
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
