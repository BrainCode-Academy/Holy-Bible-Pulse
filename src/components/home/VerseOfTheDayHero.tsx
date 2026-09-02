import React, { useState } from 'react';
import { DailyVerse } from '../../types';
import { useBible } from '../../context/BibleContext';
import {
  VotdBackground,
  VOTD_BACKGROUNDS,
  getVotdBackgroundForDate,
  getVotdBackgroundById,
} from '../../data/votdBackgrounds';
import {
  Sparkles,
  ChevronRight,
  Volume2,
  Share2,
  Bookmark as BookmarkIcon,
  Bell,
  Check,
  Lightbulb,
  Palette,
  Play,
  Pause,
  Shuffle,
  Compass,
  X,
  Camera,
} from 'lucide-react';

interface VerseOfTheDayHeroProps {
  verseOfDay: DailyVerse;
  selectedBibleId: string;
  activeAbbr: string;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onOpenReader: () => void;
  onOpenShareVerse: (text: string, reference: string) => void;
  onOpenNotifModal: () => void;
}

export const VerseOfTheDayHero: React.FC<VerseOfTheDayHeroProps> = ({
  verseOfDay,
  selectedBibleId,
  activeAbbr,
  isBookmarked,
  onToggleBookmark,
  onOpenReader,
  onOpenShareVerse,
  onOpenNotifModal,
}) => {
  const { votdSelectedBg, setVotdSelectedBg } = useBible();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showDesignPicker, setShowDesignPicker] = useState(false);
  const [isMotionEnabled, setIsMotionEnabled] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'sunrise' | 'mountains' | 'waters' | 'forests' | 'heavens' | 'nature'
  >('all');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Determine current active background
  const activeBg: VotdBackground =
    getVotdBackgroundById(votdSelectedBg) || getVotdBackgroundForDate(verseOfDay?.date);

  // Save selected background preference
  const handleSelectBackground = (id: string) => {
    setVotdSelectedBg(id);
  };

  const handleResetToDailyAuto = () => {
    setVotdSelectedBg('');
  };

  const handleShuffleBackground = () => {
    const currentIndex = VOTD_BACKGROUNDS.findIndex(b => b.id === activeBg.id);
    const nextIndex = (currentIndex + 1) % VOTD_BACKGROUNDS.length;
    handleSelectBackground(VOTD_BACKGROUNDS[nextIndex].id);
  };

  const toggleSpeakVerse = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  const handleBookmarkClick = () => {
    onToggleBookmark();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const filteredBackgrounds = VOTD_BACKGROUNDS.filter(
    bg => categoryFilter === 'all' || bg.category === categoryFilter
  );

  return (
    <div
      id="verse-of-the-day-hero-card"
      className="relative rounded-3xl overflow-hidden shadow-xl border border-white/20 text-white min-h-[230px] sm:min-h-[260px] flex flex-col justify-between transition-all group"
    >
      {/* 1. REAL HIGH-RES PHOTOGRAPHY BACKGROUND LAYER */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <img
          src={activeBg.url}
          alt={activeBg.title}
          className={`w-full h-full object-cover object-center will-change-transform transition-transform duration-1000 ${
            isMotionEnabled ? 'animate-slow-kenburns' : 'scale-105'
          }`}
          referrerPolicy="no-referrer"
          loading="eager"
        />

        {/* Ambient Warm Celestial Glow Beam */}
        <div
          className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-40 pointer-events-none transition-all duration-1000 ${
            isMotionEnabled ? 'animate-slow-pulse-glow' : ''
          }`}
          style={{
            backgroundColor: activeBg.glowColor || 'rgba(245, 158, 11, 0.4)',
          }}
        />

        {/* Subtle Sunbeam Ray in Corner */}
        {isMotionEnabled && (
          <div className="absolute -top-28 -left-28 w-72 h-72 opacity-25 pointer-events-none animate-slow-rotate-ray">
            <svg viewBox="0 0 200 200" className="w-full h-full fill-amber-100">
              <path d="M100 0 L104 96 L200 100 L104 104 L100 200 L96 104 L0 100 L96 96 Z" opacity="0.3" />
              <path d="M100 0 L102 98 L200 100 L102 102 L100 200 L98 102 L0 100 L98 98 Z" opacity="0.5" />
            </svg>
          </div>
        )}

        {/* Floating Light Sparkles */}
        {isMotionEnabled && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute left-[15%] w-2 h-2 rounded-full blur-[1px] animate-slow-float-1"
              style={{ backgroundColor: activeBg.particleColor, bottom: '-10px' }}
            />
            <div
              className="absolute left-[38%] w-1.5 h-1.5 rounded-full blur-[0.5px] animate-slow-float-2"
              style={{ backgroundColor: activeBg.particleColor, bottom: '-10px' }}
            />
            <div
              className="absolute left-[65%] w-2.5 h-2.5 rounded-full blur-[1px] animate-slow-float-3"
              style={{ backgroundColor: activeBg.particleColor, bottom: '-10px' }}
            />
            <div
              className="absolute left-[82%] w-1.5 h-1.5 rounded-full blur-[0.5px] animate-slow-float-1"
              style={{ backgroundColor: activeBg.particleColor, bottom: '-10px', animationDelay: '5s' }}
            />
          </div>
        )}

        {/* Optimized crystal-clear vignette: keeps real photo visible and vibrant while ensuring text is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* 2. CARD CONTENT CONTAINER */}
      <div className="relative z-10 p-4 sm:p-5 space-y-3 flex flex-col justify-between flex-grow">
        {/* Top Header Badge & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          {/* Badge */}
          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-black/40 border border-white/20 text-amber-300 text-[11px] font-bold tracking-wider uppercase shadow-md backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>Verse of the Day</span>
          </div>

          {/* Quick Photo Switcher, Shuffle, Motion Toggle, Notification & Translation */}
          <div className="flex items-center space-x-1">
            {/* Quick Shuffle Photo Button */}
            <button
              onClick={handleShuffleBackground}
              id="votd-shuffle-photo-btn"
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-stone-200 hover:text-amber-300 transition active:scale-95 backdrop-blur-md"
              title="Next Background Picture"
            >
              <Shuffle className="w-3 h-3" />
            </button>

            {/* Photo Gallery Picker Trigger */}
            <button
              onClick={() => setShowDesignPicker(!showDesignPicker)}
              id="votd-design-picker-btn"
              className={`p-1.5 px-2 rounded-full border transition active:scale-95 flex items-center space-x-1 text-[11px] backdrop-blur-md ${
                showDesignPicker
                  ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-lg'
                  : 'bg-black/40 hover:bg-black/60 border-white/20 text-stone-200 hover:text-amber-200'
              }`}
              title="Browse Photo Gallery"
            >
              <Palette className="w-3 h-3" />
              <span className="hidden sm:inline text-[10px] font-semibold">Photos</span>
            </button>

            {/* Slow Motion Pause/Resume Toggle */}
            <button
              onClick={() => setIsMotionEnabled(!isMotionEnabled)}
              id="votd-motion-toggle-btn"
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-stone-200 hover:text-amber-200 transition active:scale-95 backdrop-blur-md"
              title={isMotionEnabled ? 'Pause Slow Motion' : 'Enable Slow Motion'}
            >
              {isMotionEnabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>

            {/* Notification trigger */}
            <button
              onClick={onOpenNotifModal}
              className="p-1.5 rounded-full bg-black/40 hover:bg-amber-500/40 border border-white/20 text-stone-200 hover:text-amber-200 transition active:scale-95 backdrop-blur-md"
              title="Daily Verse Notifications"
              id="votd-notification-btn"
            >
              <Bell className="w-3 h-3" />
            </button>

            {/* Translation Badge */}
            <span className="px-2 py-0.5 rounded-full bg-black/40 border border-white/20 text-stone-200 text-[11px] font-semibold uppercase backdrop-blur-md">
              {verseOfDay.translation || activeAbbr}
            </span>
          </div>
        </div>

        {/* Real Photo Selector Drawer Overlay */}
        {showDesignPicker && (
          <div className="relative z-20 p-4 rounded-2xl bg-black/90 border border-amber-500/40 backdrop-blur-xl animate-fadeIn space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-1 border-b border-white/15">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Real Picture Backgrounds ({VOTD_BACKGROUNDS.length} Photos)</span>
              </div>
              <div className="flex items-center space-x-2">
                {votdSelectedBg && (
                  <button
                    onClick={handleResetToDailyAuto}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Reset Auto
                  </button>
                )}
                <button
                  onClick={() => setShowDesignPicker(false)}
                  className="p-1 text-stone-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex space-x-1 bg-white/10 p-1 rounded-xl overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'all', label: 'All Photos' },
                  { id: 'sunrise', label: 'Sunrises' },
                  { id: 'mountains', label: 'Mountains' },
                  { id: 'waters', label: 'Oceans & Lakes' },
                  { id: 'forests', label: 'Forests' },
                  { id: 'heavens', label: 'Starlight Sky' },
                  { id: 'nature', label: 'Meadows' },
                ] as const
              ).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={`py-1 px-2.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                    categoryFilter === cat.id
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Photo thumbnail grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-0.5">
              {filteredBackgrounds.map(bg => {
                const isSelected = activeBg.id === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => handleSelectBackground(bg.id)}
                    className={`relative rounded-xl overflow-hidden h-20 border-2 transition transform active:scale-95 group text-left ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-lg scale-105'
                        : 'border-white/20 hover:border-amber-300/70 opacity-80 hover:opacity-100'
                    }`}
                    title={`${bg.title} — ${bg.location || ''}`}
                  >
                    <img
                      src={bg.thumbnailUrl || bg.url}
                      alt={bg.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-white leading-tight line-clamp-1">
                      {bg.title}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 p-0.5 rounded-full bg-amber-500 text-stone-950">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scripture Quote */}
        <div className="space-y-2 py-0.5">
          <blockquote className="font-serif text-base sm:text-xl leading-snug sm:leading-relaxed font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] tracking-wide">
            "{verseOfDay.text}"
          </blockquote>

          {/* Reference, Date, and Photo Location */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="font-serif font-bold text-amber-300 text-sm sm:text-lg drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              — {verseOfDay.reference}
            </span>
            <span className="text-[11px] text-stone-200 font-sans font-medium drop-shadow">
              ({verseOfDay.date})
            </span>

            {/* Real photo location badge */}
            <span className="inline-flex items-center space-x-1 text-[10px] text-stone-200 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15">
              <Compass className="w-2.5 h-2.5 text-amber-400" />
              <span>{activeBg.title}{activeBg.location ? ` • ${activeBg.location}` : ''}</span>
            </span>
          </div>
        </div>

        {/* Daily Reflection Dropdown if available */}
        {verseOfDay.reflection && (
          <div className="pt-0">
            {showReflection ? (
              <div className="p-3 rounded-2xl bg-black/80 border border-amber-500/30 text-xs text-stone-200 leading-relaxed italic backdrop-blur-md animate-fadeIn space-y-1">
                <div className="flex items-center justify-between not-italic">
                  <span className="font-bold text-amber-300 flex items-center space-x-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daily Reflection</span>
                  </span>
                  <button
                    onClick={() => setShowReflection(false)}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Hide
                  </button>
                </div>
                <p>{verseOfDay.reflection}</p>
              </div>
            ) : (
              <button
                onClick={() => setShowReflection(true)}
                className="text-xs text-amber-300 hover:text-amber-200 underline flex items-center space-x-1 font-semibold transition drop-shadow"
              >
                <Lightbulb className="w-3 h-3" />
                <span>Read Daily Reflection</span>
              </button>
            )}
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="pt-2.5 border-t border-white/20 flex flex-wrap items-center justify-between gap-2">
          {/* Primary Action: Read in Bible */}
          <button
            onClick={onOpenReader}
            id="votd-read-in-bible-btn"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs shadow-md shadow-black/50 flex items-center space-x-1 transition transform active:scale-95"
          >
            <span>Read in Bible</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Secondary Actions: Audio, Share, Bookmark */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => toggleSpeakVerse(verseOfDay.text)}
              className={`p-2 rounded-xl border border-white/20 transition backdrop-blur-md ${
                isPlayingAudio
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                  : 'bg-black/40 hover:bg-black/60 text-stone-100'
              }`}
              title="Listen to Verse Audio"
              id="votd-listen-btn"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onOpenShareVerse(verseOfDay.text, verseOfDay.reference)}
              className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-stone-100 transition backdrop-blur-md active:scale-95"
              title="Share Verse Image Card"
              id="votd-share-btn"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleBookmarkClick}
              className={`p-2 rounded-xl border border-white/20 transition backdrop-blur-md active:scale-95 ${
                isBookmarked
                  ? 'bg-amber-500 text-stone-950 font-bold border-amber-400 shadow-md'
                  : 'bg-black/40 hover:bg-black/60 text-stone-100'
              }`}
              title={isBookmarked ? 'Bookmarked' : 'Save Bookmark'}
              id="votd-bookmark-btn"
            >
              {savedSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-300 animate-scale-up" />
              ) : (
                <BookmarkIcon
                  className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-stone-950' : ''}`}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

