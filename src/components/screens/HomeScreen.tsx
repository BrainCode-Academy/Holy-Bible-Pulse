import React, { useState, useEffect } from 'react';
import { useBible } from '../../context/BibleContext';
import { getVerseOfDay, getDailyDevotional } from '../../services/api';
import { DailyVerse, DailyDevotional } from '../../types';
import { VerseOfTheDayHero } from '../home/VerseOfTheDayHero';
import { VotdNotificationModal } from '../modals/VotdNotificationModal';
import { APP_LOGO, APP_LOGO_ALT } from '../../constants/assets';
import { useDynamicGreeting } from '../../utils/greetingUtils';
import {
  BookOpen,
  ChevronRight,
  Flame,
  Heart,
  Calendar,
  Sun,
  Moon,
  Coffee,
  Sparkles,
  Search,
  Volume2,
  BookMarked,
  Music,
  Clock,
} from 'lucide-react';

export const HomeScreen: React.FC<{
  onOpenPrayer: () => void;
  onOpenShareVerse: (verseText: string, reference: string) => void;
}> = ({ onOpenPrayer, onOpenShareVerse }) => {
  const {
    openReader,
    setActiveTab,
    readingProgress,
    plans,
    readerSettings,
    selectedBibleId,
    bibles,
    toggleBookmark,
    isBookmarked,
    user,
  } = useBible();

  const [verseOfDay, setVerseOfDay] = useState<DailyVerse | null>(null);
  const [devotional, setDevotional] = useState<DailyDevotional | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);

  // Dynamic time-based greeting using local time & active user profile
  const greetingInfo = useDynamicGreeting(user);

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  useEffect(() => {
    // Pass user's local date YYYY-MM-DD so server returns exact matching date verse
    const todayLocal = new Date();
    const dateParam = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;

    getVerseOfDay()
      .then(setVerseOfDay)
      .catch(err => console.warn('Failed to load VOTD', err));

    getDailyDevotional()
      .then(setDevotional)
      .catch(err => console.warn('Failed to load Devotional', err));
  }, []);

  const enrolledPlan = plans.find(p => p.isEnrolled) || plans[0];

  // Card theme styling
  const cardBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-amber-100/80 text-stone-900 shadow-sm';

  const subText = isDark ? 'text-stone-400' : isSepia ? 'text-[#705b41]' : 'text-stone-500';

  const activeBibleObj = bibles.find(b => b.id === selectedBibleId);
  const activeAbbr = activeBibleObj ? activeBibleObj.abbreviation : 'KJV';

  // Bookmark check for Verse of the Day
  const votdVerseId = verseOfDay ? `${verseOfDay.bookId}.${verseOfDay.chapterId}.${verseOfDay.verseNumber}` : '';
  const isVotdSaved = verseOfDay
    ? isBookmarked(votdVerseId) || isBookmarked(verseOfDay.reference)
    : false;

  const handleToggleSaveVotd = () => {
    if (!verseOfDay) return;
    toggleBookmark(votdVerseId, verseOfDay.reference, verseOfDay.text);
  };

  const getGreetingIcon = () => {
    switch (greetingInfo.period) {
      case 'morning':
        return <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />;
      case 'afternoon':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case 'evening':
        return <Moon className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. DYNAMIC TIME-BASED GREETING BANNER */}
      <div
        id="home-greeting-banner"
        className={`p-5 sm:p-6 rounded-3xl border ${cardBg} relative overflow-hidden transition-all`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {getGreetingIcon()}
              <span>{greetingInfo.greetingTitle}</span>
              <span className="text-[11px] font-normal text-stone-400">• {greetingInfo.timeString}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {greetingInfo.formattedGreeting}
            </h1>

            <p className={`text-xs sm:text-sm mt-0.5 ${subText}`}>
              {greetingInfo.subMessage}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-1 shrink-0">
            <img
              src={APP_LOGO}
              alt={APP_LOGO_ALT}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-amber-500/30 shadow-md flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 tracking-wider">
              HOLY BIBLE+
            </span>
          </div>
        </div>
      </div>

      {/* 2. VERSE OF THE DAY (THE HERO CARD WITH ANIMATED BACKGROUND DESIGNS & ACTIONS) */}
      {verseOfDay && (
        <VerseOfTheDayHero
          verseOfDay={verseOfDay}
          selectedBibleId={selectedBibleId}
          activeAbbr={activeAbbr}
          isBookmarked={isVotdSaved}
          onToggleBookmark={handleToggleSaveVotd}
          onOpenReader={() =>
            openReader(
              selectedBibleId,
              verseOfDay.bookId,
              verseOfDay.chapterId,
              verseOfDay.reference
            )
          }
          onOpenShareVerse={(text, ref) => onOpenShareVerse(text, ref)}
          onOpenNotifModal={() => setIsNotifModalOpen(true)}
        />
      )}

      {/* 3. TODAY'S READING PLAN */}
      {enrolledPlan && (
        <div id="home-reading-plan-card" className={`p-5 rounded-3xl border ${cardBg} space-y-3.5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Today's Reading Plan
              </span>
            </div>
            <button
              onClick={() => setActiveTab('plans')}
              id="home-view-all-plans-btn"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-0.5"
            >
              <span>All Plans</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">{enrolledPlan.title}</h3>
              <p className={`text-xs mt-0.5 line-clamp-1 ${subText}`}>{enrolledPlan.description}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold shrink-0">
              Day {enrolledPlan.currentDay} of {enrolledPlan.durationDays}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className={subText}>Current Progress</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {Math.round((enrolledPlan.days.filter(d => d.completed).length / enrolledPlan.durationDays) * 100)}% Complete
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.max(
                    5,
                    (enrolledPlan.days.filter(d => d.completed).length / enrolledPlan.durationDays) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Continue reading action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setActiveTab('plans')}
              id="home-continue-plan-btn"
              className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center space-x-1.5 transition active:scale-95"
            >
              <span>Continue Day {enrolledPlan.currentDay} Reading</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. TODAY'S DEVOTIONAL */}
      {devotional && (
        <div id="home-devotional-card" className={`p-5 rounded-3xl border ${cardBg} space-y-3.5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Today's Devotional
              </span>
            </div>
            <button
              onClick={() => setActiveTab('devotional')}
              id="home-read-full-devotional-btn"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-0.5"
            >
              <span>Read Full</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">{devotional.title}</h3>
            <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
              Key Scripture: {devotional.scripturalReference}
            </div>
            <p className={`text-xs mt-2 leading-relaxed whitespace-pre-line line-clamp-3 ${subText}`}>
              {devotional.content}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 text-xs space-y-1">
            <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Guided Prayer:</span>
            </div>
            <p className="italic text-stone-600 dark:text-stone-300 line-clamp-2">{devotional.prayer}</p>
          </div>
        </div>
      )}

      {/* 5. QUICK ACTIONS & STUDY HUB */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Quick Actions
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Bible Index */}
          <button
            onClick={() => setActiveTab('bible')}
            id="home-quick-bible-btn"
            className={`p-3.5 rounded-2xl border ${cardBg} text-left flex flex-col justify-between space-y-2 transition hover:border-amber-400 active:scale-98`}
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm">Bible Index</div>
              <div className={`text-[11px] ${subText}`}>66 OT/NT Books</div>
            </div>
          </button>

          {/* Search Scripture */}
          <button
            onClick={() => setActiveTab('search')}
            id="home-quick-search-btn"
            className={`p-3.5 rounded-2xl border ${cardBg} text-left flex flex-col justify-between space-y-2 transition hover:border-amber-400 active:scale-98`}
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm">Search Scripture</div>
              <div className={`text-[11px] ${subText}`}>Verses &amp; Keywords</div>
            </div>
          </button>

          {/* Prayer Guide */}
          <button
            onClick={onOpenPrayer}
            id="home-quick-prayer-btn"
            className={`p-3.5 rounded-2xl border ${cardBg} text-left flex flex-col justify-between space-y-2 transition hover:border-amber-400 active:scale-98`}
          >
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 w-fit">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm">Prayer Guide</div>
              <div className={`text-[11px] ${subText}`}>Daily Petitions</div>
            </div>
          </button>

          {/* Hymns & Praise */}
          <button
            onClick={() => setActiveTab('hymns')}
            id="home-quick-hymns-btn"
            className={`p-3.5 rounded-2xl border ${cardBg} text-left flex flex-col justify-between space-y-2 transition hover:border-amber-400 active:scale-98`}
          >
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm">Hymns &amp; Songs</div>
              <div className={`text-[11px] ${subText}`}>Classic Hymnal</div>
            </div>
          </button>
        </div>
      </div>

      {/* 6. CONTINUE READING CARD (RECENT HISTORY) */}
      {readingProgress.lastReadReference && (
        <div id="home-recent-reading-card" className={`p-5 rounded-3xl border ${cardBg} space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <BookMarked className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Recently Opened
              </span>
            </div>
            <span className={`text-xs ${subText}`}>Continue where you left off</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold">
                {readingProgress.lastReadReference}
              </h2>
              <p className={`text-xs mt-0.5 ${subText}`}>
                Translation:{' '}
                <span className="font-semibold text-amber-700 dark:text-amber-400 uppercase">
                  {bibles.find(b => b.id === readingProgress.lastReadBibleId)?.abbreviation || selectedBibleId}
                </span>
              </p>
            </div>

            <button
              onClick={() =>
                openReader(
                  readingProgress.lastReadBibleId || selectedBibleId,
                  readingProgress.lastReadBookId,
                  readingProgress.lastReadChapterId,
                  readingProgress.lastReadReference
                )
              }
              id="home-continue-reading-button"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium text-xs shadow-md shadow-amber-600/20 flex items-center space-x-1.5 transition transform active:scale-95"
            >
              <span>Read Chapter</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Daily Verse Notification Modal */}
      <VotdNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        verseOfDay={verseOfDay}
      />
    </div>
  );
};
