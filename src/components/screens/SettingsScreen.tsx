import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { VotdNotificationModal } from '../modals/VotdNotificationModal';
import { APP_LOGO, APP_LOGO_ALT } from '../../constants/assets';
import { getNotificationSettings } from '../../services/notificationService';
import { audioService } from '../../services/audioService';
import {
  Sliders,
  Key,
  ShieldCheck,
  Globe,
  Info,
  Type,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Bell,
  ChevronRight,
  Volume2,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    readerSettings,
    updateSettings,
    serverStatus,
    reloadServerStatus,
    bibles,
    resetAllData,
    audioSpeed,
    setAudioSpeed,
  } = useBible();

  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const notifSettings = getNotificationSettings();

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const cardBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-amber-100/80 text-stone-900 shadow-sm';

  const subText = isDark ? 'text-stone-400' : isSepia ? 'text-[#705b41]' : 'text-stone-500';

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-2`}>
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Settings & Architecture
          </span>
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Application Preferences
        </h1>
        <p className={`text-xs ${subText}`}>
          Customize your reading experience, review translation providers, and manage API keys.
        </p>
      </div>

      {/* 1. Reader Appearance Settings */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-4`}>
        <div className="flex items-center space-x-2">
          <Type className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Reader Display Preferences
          </h2>
        </div>

        {/* Theme Mode */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-stone-500">Theme Mode:</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
              { id: 'sepia', label: 'Sepia', icon: <Coffee className="w-4 h-4" /> },
              { id: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => updateSettings({ themeMode: t.id as any })}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-2xl border text-xs font-semibold transition ${
                  readerSettings.themeMode === t.id
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-stone-500">Typography Font:</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'serif', label: 'Serif (Georgia)' },
              { id: 'sans', label: 'Sans (Clean)' },
              { id: 'mono', label: 'Monospace' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => updateSettings({ fontFamily: f.id as any })}
                className={`py-2 px-2 rounded-2xl border text-[11px] font-semibold transition ${
                  readerSettings.fontFamily === f.id
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-stone-800">
          <div>
            <div className="text-xs font-semibold">Font Size</div>
            <div className={`text-[11px] ${subText}`}>{readerSettings.fontSize}px</div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateSettings({ fontSize: Math.max(14, readerSettings.fontSize - 2) })}
              className="px-3.5 py-1.5 rounded-xl border bg-stone-50 dark:bg-stone-800 font-bold text-xs"
            >
              A-
            </button>
            <button
              onClick={() => updateSettings({ fontSize: Math.min(28, readerSettings.fontSize + 2) })}
              className="px-3.5 py-1.5 rounded-xl border bg-stone-50 dark:bg-stone-800 font-bold text-xs"
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Audio / Text-to-Speech Settings */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-4`}>
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Audio & Text-to-Speech
          </h2>
        </div>

        <p className={`text-xs leading-relaxed ${subText}`}>
          Configure voice, default playback speed, and automatic chapter continuation for listening in the Bible Reader.
        </p>

        {/* Voice Selector */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-stone-500">Speech Voice:</span>
          <select
            value={readerSettings.selectedVoiceURI || ''}
            onChange={e => updateSettings({ selectedVoiceURI: e.target.value || null })}
            className="w-full p-2.5 rounded-2xl border bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">System Default (Auto Language Match)</option>
            {audioService.getVoices().map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Playback Speed */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-stone-500 font-sans">Default Speed:</span>
          <div className="grid grid-cols-5 gap-1.5">
            {[0.75, 1.0, 1.25, 1.5, 2.0].map(sp => (
              <button
                key={sp}
                onClick={() => setAudioSpeed(sp)}
                className={`py-2 px-1 rounded-xl border text-xs font-bold transition ${
                  audioSpeed === sp
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                {sp}×
              </button>
            ))}
          </div>
        </div>

        {/* Auto-Play Next Chapter Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-stone-800">
          <div>
            <div className="text-xs font-semibold">Auto-Play Next Chapter</div>
            <div className={`text-[11px] ${subText}`}>
              Automatically open and read the next chapter when a chapter finishes
            </div>
          </div>
          <button
            onClick={() =>
              updateSettings({ autoPlayNextChapter: !readerSettings.autoPlayNextChapter })
            }
            className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
              readerSettings.autoPlayNextChapter
                ? 'bg-amber-600 text-white'
                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
            }`}
          >
            {readerSettings.autoPlayNextChapter ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 2. Daily Notifications & Reminders */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Daily Notifications &amp; Reminders
            </h2>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              notifSettings.dailyVerseEnabled ||
              notifSettings.devotionalEnabled ||
              notifSettings.readingPlanEnabled ||
              notifSettings.prayerReminderEnabled
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
            }`}
          >
            {notifSettings.dailyVerseEnabled ||
            notifSettings.devotionalEnabled ||
            notifSettings.readingPlanEnabled ||
            notifSettings.prayerReminderEnabled
              ? 'ACTIVE'
              : 'OFF'}
          </span>
        </div>

        <p className={`text-xs leading-relaxed ${subText}`}>
          Receive scheduled reminders for Verse of the Day, Daily Devotionals, Reading Plans, and Prayer times.
        </p>

        {/* Active badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {notifSettings.dailyVerseEnabled && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
              📖 Verse ({notifSettings.dailyVerseTime})
            </span>
          )}
          {notifSettings.devotionalEnabled && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/20">
              ✝️ Devotional ({notifSettings.devotionalTime})
            </span>
          )}
          {notifSettings.readingPlanEnabled && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20">
              📚 Plan ({notifSettings.readingPlanTime})
            </span>
          )}
          {notifSettings.prayerReminderEnabled && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20">
              🙏 Prayer ({notifSettings.prayerReminderTime})
            </span>
          )}
        </div>

        <button
          onClick={() => setIsNotifModalOpen(true)}
          id="settings-configure-notifications-btn"
          className="w-full py-3 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-between transition active:scale-98"
        >
          <span>Configure Notification Times &amp; Test Alerts</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. API.Bible Provider & Integration Status */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-stone-700 dark:text-stone-300">
              API.Bible Server Provider
            </h2>
          </div>

          <button
            onClick={reloadServerStatus}
            className="p-1.5 rounded-xl hover:bg-amber-500/10 text-stone-500 transition"
            title="Refresh Server Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {serverStatus ? (
          <div className="space-y-3">
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              serverStatus.apiBibleKeyPresent
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center space-x-2.5">
                {serverStatus.apiBibleKeyPresent ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-xs">
                    {serverStatus.apiBibleKeyPresent ? 'API.Bible Key Configured' : 'Public Domain Provider Active'}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {serverStatus.apiBibleKeyPresent
                      ? 'Full access enabled for copyrighted & licensed Bible translations.'
                      : 'Using built-in Public Domain engine (WEB, KJV, Spanish, French) with zero external key required.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Providers List */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-500">Available Provider Services:</span>
              {serverStatus.providers.map(p => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl border border-stone-200/60 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{p.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      p.enabled ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                    }`}>
                      {p.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className={`text-[11px] ${subText}`}>{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-stone-400">Loading provider status...</div>
        )}

        {/* Instructions for API_BIBLE_KEY */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 text-xs space-y-2">
          <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1">
            <Info className="w-4 h-4 text-amber-600" />
            <span>How to add API_BIBLE_KEY:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-stone-600 dark:text-stone-300 leading-relaxed text-[11px]">
            <li>Sign up for a free API key at <a href="https://scripture.api.bible" target="_blank" rel="noreferrer" className="text-amber-600 underline">scripture.api.bible</a>.</li>
            <li>In AI Studio Secrets Settings, add the environment variable: <code className="bg-stone-200 dark:bg-stone-700 px-1 py-0.5 rounded">API_BIBLE_KEY</code>.</li>
            <li>The server automatically detects the key and connects to API.Bible to unlock additional copyrighted translations.</li>
          </ol>
        </div>
      </div>

      {/* 4. Licensing & Copyright Notice */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-2 text-xs`}>
        <div className="flex items-center space-x-2 text-stone-800 dark:text-stone-200 font-bold">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Copyright & Licensing Notice</span>
        </div>
        <p className={`leading-relaxed ${subText}`}>
          Holy Bible+ respects copyright law. Public Domain translations (such as WEB and KJV) are freely available. Licensed copyrighted translations are served strictly via authorized API.Bible integrations on the server side without exposing API keys or hardcoding copyrighted text in source repositories.
        </p>
      </div>

      {/* 5. Storage & Reset Section */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-3 text-xs`}>
        <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold">
          <RefreshCw className="w-4 h-4" />
          <span>Reset Local Application Data</span>
        </div>
        <p className={`leading-relaxed ${subText}`}>
          Clear all locally saved bookmarks, highlights, notes, reading progress, and prayer requests.
        </p>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20 transition"
          >
            Reset Local Storage Data
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <p className="font-bold text-rose-700 dark:text-rose-300">Are you sure? This action cannot be undone.</p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold"
              >
                Yes, Reset All
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. About App Branding */}
      <div className={`p-6 rounded-3xl border ${cardBg} flex items-center space-x-4 shadow-xs`}>
        <img
          src={APP_LOGO}
          alt={APP_LOGO_ALT}
          className="w-16 h-16 rounded-2xl object-cover border border-amber-500/30 shadow-md flex-shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="space-y-1">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
            Holy Bible+ <span className="text-amber-600 text-xs font-sans font-black">v1.0</span>
          </h3>
          <p className={`text-xs ${subText} leading-relaxed`}>
            A peaceful scripture reading, prayer intercession, audio, and devotional companion.
          </p>
        </div>
      </div>

      <VotdNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </div>
  );
};
