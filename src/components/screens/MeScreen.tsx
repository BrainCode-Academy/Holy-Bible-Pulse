import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { VotdNotificationModal } from '../modals/VotdNotificationModal';
import { EditProfileModal } from '../modals/EditProfileModal';
import { UserAvatar } from '../common/UserAvatar';
import { APP_LOGO, APP_LOGO_ALT } from '../../constants/assets';
import { getNotificationSettings } from '../../services/notificationService';
import { audioService } from '../../services/audioService';
import {
  User as UserIcon,
  LogOut,
  Bookmark,
  Highlighter,
  FileText,
  Calendar,
  HeartHandshake,
  Shield,
  Sliders,
  Bell,
  Volume2,
  Type,
  Sun,
  Moon,
  Coffee,
  Laptop,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Key,
  Edit2,
  Save,
  X,
  Sparkles,
  CloudCheck,
  ExternalLink,
  Camera,
} from 'lucide-react';

export const MeScreen: React.FC = () => {
  const {
    user,
    isLoadingUser,
    openAuthModal,
    logout,
    updateUserProfile,
    isSyncing,
    syncUserCloudData,
    bookmarks,
    highlights,
    notes,
    plans,
    prayers,
    readerSettings,
    updateSettings,
    serverStatus,
    reloadServerStatus,
    audioSpeed,
    setAudioSpeed,
    setActiveTab,
    resetAllData,
  } = useBible();

  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const notifSettings = getNotificationSettings();
  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const cardBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-stone-200 text-stone-900 shadow-sm';

  const subText = isDark ? 'text-stone-400' : isSepia ? 'text-[#705b41]' : 'text-stone-500';

  const activePlansCount = plans.filter((p) => p.isEnrolled).length;
  const activePrayersCount = prayers.filter((p) => p.status === 'active').length;

  return (
    <div id="me-screen-container" className="space-y-6 pb-24 max-w-3xl mx-auto">
      {/* 1. Profile / Account Header Card */}
      {user ? (
        <div id="me-profile-card" className={`p-6 rounded-3xl border ${cardBg} space-y-5 relative overflow-hidden`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative group shrink-0">
                <UserAvatar
                  avatarUrl={user.avatarUrl}
                  profileImageType={user.profileImageType}
                  avatarId={user.avatarId}
                  avatarBgColor={user.avatarBgColor}
                  fullName={user.fullName}
                  size="lg"
                  roundedClassName="rounded-2xl"
                  borderClassName="border-2 border-amber-500/40 shadow-md"
                />
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-md border-2 border-white dark:border-stone-900 transition active:scale-95"
                  title="Change profile picture"
                >
                  <Camera size={11} />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                    {user.fullName || 'Beloved Reader'}
                  </h1>
                </div>

                <p className={`text-xs ${subText} flex flex-wrap items-center gap-1.5`}>
                  <span>{user.email}</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-stone-400"></span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                    {user.role} • {user.authProvider === 'google' ? 'Google Account' : 'Email Account'}
                  </span>
                </p>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-start sm:justify-end">
              <button
                id="edit-profile-open-btn"
                onClick={() => setIsEditProfileModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                <Edit2 size={13} />
                <span>Edit Profile</span>
              </button>

              {user.role === 'ADMIN' && (
                <button
                  id="admin-dashboard-nav-btn"
                  onClick={() => setActiveTab('admin')}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <Shield size={13} />
                  <span>Admin Dashboard</span>
                </button>
              )}

              <button
                id="sign-out-btn"
                onClick={() => logout()}
                className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Sync Status Banner */}
          <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={15} />
              <span>Cloud Backup &amp; Sync Active</span>
            </div>
            <button
              onClick={syncUserCloudData}
              disabled={isSyncing}
              className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1 transition"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Not Signed In View */
        <div id="me-guest-card" className={`p-6 rounded-3xl border ${cardBg} space-y-5 text-center sm:text-left`}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} />
                <span>Holy Bible+ Account</span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                Welcome to Holy Bible+
              </h1>
              <p className={`text-xs ${subText} max-w-md`}>
                Sign in or create a free account to backup your highlights, bookmarks, personal notes, and reading plans across all your devices.
              </p>
            </div>

            <img
              src={APP_LOGO}
              alt={APP_LOGO_ALT}
              className="w-16 h-16 rounded-2xl object-cover border border-amber-500/30 shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              id="guest-signin-btn"
              onClick={() => openAuthModal('login')}
              className="w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Sign In
            </button>
            <button
              id="guest-register-btn"
              onClick={() => openAuthModal('register')}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs rounded-xl transition"
            >
              Create Account
            </button>
            <button
              id="guest-google-btn"
              onClick={() => openAuthModal('login')}
              className="w-full py-2.5 px-4 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      )}

      {/* 2. User Content Shortcuts (Bookmarks, Highlights, Notes, Plans, Prayers) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
          {user ? 'My Scripture Journey & Activity' : 'Your Local Reading Activity'}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Bookmarks */}
          <button
            onClick={() => setActiveTab('saved')}
            className={`p-4 rounded-2xl border ${cardBg} text-left flex flex-col justify-between hover:border-amber-500/50 transition group`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition">
                <Bookmark size={18} />
              </div>
              <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif">{bookmarks.length}</div>
              <div className={`text-xs ${subText} font-medium`}>Bookmarks</div>
            </div>
          </button>

          {/* Highlights */}
          <button
            onClick={() => setActiveTab('saved')}
            className={`p-4 rounded-2xl border ${cardBg} text-left flex flex-col justify-between hover:border-amber-500/50 transition group`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition">
                <Highlighter size={18} />
              </div>
              <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif">{highlights.length}</div>
              <div className={`text-xs ${subText} font-medium`}>Highlights</div>
            </div>
          </button>

          {/* Notes */}
          <button
            onClick={() => setActiveTab('saved')}
            className={`p-4 rounded-2xl border ${cardBg} text-left flex flex-col justify-between hover:border-amber-500/50 transition group`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition">
                <FileText size={18} />
              </div>
              <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif">{notes.length}</div>
              <div className={`text-xs ${subText} font-medium`}>Study Notes</div>
            </div>
          </button>

          {/* Reading Plans */}
          <button
            onClick={() => setActiveTab('plans')}
            className={`p-4 rounded-2xl border ${cardBg} text-left flex flex-col justify-between hover:border-amber-500/50 transition group`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition">
                <Calendar size={18} />
              </div>
              <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif">{activePlansCount}</div>
              <div className={`text-xs ${subText} font-medium`}>Active Plans</div>
            </div>
          </button>

          {/* Prayers */}
          <button
            onClick={() => setActiveTab('prayer')}
            className={`p-4 rounded-2xl border ${cardBg} text-left flex flex-col justify-between hover:border-amber-500/50 transition group`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 group-hover:scale-105 transition">
                <HeartHandshake size={18} />
              </div>
              <ChevronRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif">{activePrayersCount}</div>
              <div className={`text-xs ${subText} font-medium`}>Active Prayers</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Reader Display Preferences */}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'system', label: 'System', icon: <Laptop className="w-4 h-4" /> },
              { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
              { id: 'sepia', label: 'Sepia', icon: <Coffee className="w-4 h-4" /> },
              { id: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
            ].map((t) => (
              <button
                key={t.id}
                id={`theme-mode-btn-${t.id}`}
                onClick={() => updateSettings({ themeMode: t.id as any })}
                className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-2xl border text-xs font-semibold transition ${
                  readerSettings.themeMode === t.id
                    ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-500'
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
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => updateSettings({ fontFamily: f.id as any })}
                className={`py-2 px-2 rounded-2xl border text-[11px] font-semibold transition ${
                  readerSettings.fontFamily === f.id
                    ? 'bg-amber-700 text-white border-amber-700'
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

      {/* 4. Audio / Text-to-Speech Settings */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-4`}>
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Audio &amp; Text-to-Speech
          </h2>
        </div>

        {/* Voice Selector */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-stone-500">Speech Voice:</span>
          <select
            value={readerSettings.selectedVoiceURI || ''}
            onChange={(e) => updateSettings({ selectedVoiceURI: e.target.value || null })}
            className="w-full p-2.5 rounded-2xl border bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
          >
            <option value="">System Default (Auto Language Match)</option>
            {audioService.getVoices().map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Playback Speed */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-stone-500">Default Speed:</span>
          <div className="grid grid-cols-5 gap-1.5">
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((sp) => (
              <button
                key={sp}
                onClick={() => setAudioSpeed(sp)}
                className={`py-2 px-1 rounded-xl border text-xs font-bold transition ${
                  audioSpeed === sp
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                {sp}×
              </button>
            ))}
          </div>
        </div>

        {/* Auto-Play Next Chapter */}
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
                ? 'bg-amber-700 text-white'
                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
            }`}
          >
            {readerSettings.autoPlayNextChapter ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 5. Daily Notifications & Reminders */}
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
          Customize daily reminders for Scripture, Devotionals, Reading Plans, and Prayer times.
        </p>

        {/* Active badges list */}
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
          id="me-configure-notifications-btn"
          className="w-full py-3 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-between transition"
        >
          <span>Configure Notification Times &amp; Test Alerts</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 6. API.Bible Provider Status */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-stone-700 dark:text-stone-300">
              API.Bible Provider
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

        {serverStatus && (
          <div className="space-y-3">
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                serverStatus.apiBibleKeyPresent
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {serverStatus.apiBibleKeyPresent ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-xs">
                    {serverStatus.apiBibleKeyPresent ? 'API.Bible Key Configured' : 'Public Domain Provider Active'}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {serverStatus.apiBibleKeyPresent
                      ? 'Full access enabled for copyrighted & licensed Bible translations.'
                      : 'Using built-in Public Domain engine (WEB, KJV, Spanish, French).'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. Reset Data */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-3 text-xs`}>
        <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold">
          <RefreshCw className="w-4 h-4" />
          <span>Reset Local Application Data</span>
        </div>
        <p className={`leading-relaxed ${subText}`}>
          Clear all locally cached bookmarks, highlights, notes, reading progress, and prayer requests.
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

      {/* 8. About Holy Bible+ */}
      <div className={`p-6 rounded-3xl border ${cardBg} flex items-center space-x-4`}>
        <img
          src={APP_LOGO}
          alt={APP_LOGO_ALT}
          className="w-14 h-14 rounded-2xl object-cover border border-amber-500/30 shadow-md flex-shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="space-y-0.5">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
            Holy Bible+ <span className="text-amber-700 dark:text-amber-400 text-xs font-sans font-black">v1.0</span>
          </h3>
          <p className={`text-xs ${subText}`}>
            A peaceful scripture reading, prayer intercession, audio, and devotional companion.
          </p>
        </div>
      </div>

      <VotdNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
      />
    </div>
  );
};
