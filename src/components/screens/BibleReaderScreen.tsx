import React, { useState, useEffect } from 'react';
import { useBible } from '../../context/BibleContext';
import { getBibleChapter } from '../../services/api';
import { audioService, AudioState } from '../../services/audioService';
import { Chapter, Verse } from '../../types';
import { ScriptureCopyright } from '../bible/ScriptureCopyright';
import { BibleVersionSelectorModal } from '../modals/BibleVersionSelectorModal';
import {
  ChevronLeft,
  ChevronRight,
  Type,
  Sun,
  Moon,
  Coffee,
  Laptop,
  Bookmark,
  Volume2,
  VolumeX,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  Sparkles,
  FileText,
} from 'lucide-react';

export const BibleReaderScreen: React.FC<{
  onOpenContextMenu: (verse: Verse) => void;
  onOpenMessageOutline?: (ref: string) => void;
}> = ({ onOpenContextMenu, onOpenMessageOutline }) => {
  const {
    selectedBibleId,
    bibles,
    currentBookId,
    currentChapterId,
    setCurrentReference,
    readerSettings,
    updateSettings,
    isBookmarked,
    getHighlightColor,
    updateReadingProgress,
    openReader,
    setActiveTab,
    targetVerseId,
    setTargetVerseId,
    audioSpeed,
  } = useBible();

  const [chapterData, setChapterData] = useState<{ chapter: Chapter; verses: Verse[] } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAppearanceMenu, setShowAppearanceMenu] = useState<boolean>(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);

  // Audio State & Highlighting
  const [audioState, setAudioState] = useState<AudioState>(audioService.getState());
  const [showCompletedPrompt, setShowCompletedPrompt] = useState<boolean>(false);
  const [completedRef, setCompletedRef] = useState<string>('');

  // Active Bible details
  const activeBible = bibles.find(b => b.id === selectedBibleId) || {
    id: selectedBibleId,
    abbreviation: selectedBibleId.toUpperCase(),
    name: selectedBibleId.toUpperCase(),
    language: { id: 'eng', name: 'English', nameLocal: 'English' },
  };

  // Subscribe to Audio Service
  useEffect(() => {
    const unsub = audioService.subscribe(state => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  // Handle Chapter Completion Event
  useEffect(() => {
    const unsub = audioService.subscribeChapterComplete(finishedRef => {
      setCompletedRef(finishedRef);
      if (readerSettings.autoPlayNextChapter && chapterData?.chapter?.nextChapterId) {
        openReader(selectedBibleId, currentBookId, chapterData.chapter.nextChapterId);
      } else {
        setShowCompletedPrompt(true);
      }
    });
    return () => unsub();
  }, [chapterData, readerSettings.autoPlayNextChapter, selectedBibleId, currentBookId]);

  // Sync settings with audioService
  useEffect(() => {
    audioService.setRate(audioSpeed);
  }, [audioSpeed]);

  useEffect(() => {
    audioService.setSelectedVoiceURI(readerSettings.selectedVoiceURI || null);
  }, [readerSettings.selectedVoiceURI]);

  useEffect(() => {
    audioService.setAutoPlayNextChapter(!!readerSettings.autoPlayNextChapter);
  }, [readerSettings.autoPlayNextChapter]);

  // Stop audio whenever Bible translation or chapter changes
  useEffect(() => {
    audioService.stop();
    setShowCompletedPrompt(false);
  }, [selectedBibleId, currentChapterId]);

  // Theme configuration
  const isDark =
    readerSettings.themeMode === 'dark' ||
    (readerSettings.themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  const isSepia = readerSettings.themeMode === 'sepia';

  const containerBg = isDark
    ? 'bg-stone-950 text-stone-200'
    : isSepia
    ? 'bg-[#fbf7ee] text-[#3d2e1e]'
    : 'bg-white text-stone-900';

  const cardBg = isDark
    ? 'bg-stone-900 border-stone-800'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be]'
    : 'bg-stone-50 border-stone-200';

  // Typography font class
  const fontClass =
    readerSettings.fontFamily === 'serif'
      ? 'font-serif'
      : readerSettings.fontFamily === 'mono'
      ? 'font-mono'
      : 'font-sans';

  // Line spacing class
  const spacingClass =
    readerSettings.lineSpacing === 'compact'
      ? 'leading-normal space-y-2'
      : readerSettings.lineSpacing === 'spacious'
      ? 'leading-loose space-y-5'
      : 'leading-relaxed space-y-3.5';

  // Load Chapter Data whenever chapter, book or translation changes
  const loadChapter = () => {
    setIsLoading(true);
    setErrorMessage(null);
    getBibleChapter(selectedBibleId, currentChapterId)
      .then(res => {
        if (!res || !res.verses || res.verses.length === 0) {
          setErrorMessage('Chapter text is not available in this Bible translation.');
          setChapterData(null);
        } else {
          setChapterData(res);
          if (res?.chapter?.reference) {
            setCurrentReference(res.chapter.reference);
            updateReadingProgress(
              selectedBibleId,
              res.chapter.bookId,
              res.chapter.id,
              res.chapter.reference
            );
          }
        }
      })
      .catch(err => {
        console.warn('Failed to load chapter', err);
        setErrorMessage('Unable to load chapter text. Please check connection or try another translation.');
        setChapterData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadChapter();
  }, [selectedBibleId, currentChapterId]);

  // Scroll to and highlight target verse when opened from Search
  useEffect(() => {
    if (!isLoading && chapterData && targetVerseId) {
      const timer = setTimeout(() => {
        const elem = document.getElementById(`verse-${targetVerseId}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          elem.classList.add('ring-2', 'ring-amber-500', 'ring-offset-2', 'rounded');
          const removeTimer = setTimeout(() => {
            elem.classList.remove('ring-2', 'ring-amber-500', 'ring-offset-2', 'rounded');
            setTargetVerseId(null);
          }, 3000);
          return () => clearTimeout(removeTimer);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, chapterData, targetVerseId]);

  // Auto-scroll to currently spoken verse during Audio Playback
  useEffect(() => {
    if ((audioState.isPlaying || audioState.isPaused) && audioState.currentVerse) {
      const elem = document.getElementById(`verse-${audioState.currentVerse.id}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [audioState.currentVerse?.id, audioState.isPlaying]);

  // Handle Listen Audio Button Toggle
  const handleToggleAudio = () => {
    if (!audioService.isSupported()) {
      alert('Text-to-Speech is not available on this device or browser.');
      return;
    }

    if (audioState.isPlaying || audioState.isPaused) {
      audioService.stop();
    } else if (chapterData?.verses && chapterData.verses.length > 0) {
      const lang = activeBible.language?.id || 'eng';
      audioService.startChapter(
        chapterData.verses,
        chapterData.chapter.reference,
        lang,
        0
      );
    }
  };

  const handleContinueToNextChapter = () => {
    setShowCompletedPrompt(false);
    if (chapterData?.chapter?.nextChapterId) {
      openReader(selectedBibleId, currentBookId, chapterData.chapter.nextChapterId);
    }
  };

  const handleVerseClick = (verse: Verse) => {
    onOpenContextMenu(verse);
  };

  // Get color highlight styles for saved highlights
  const getHighlightStyle = (color: string | null) => {
    if (!color) return '';
    switch (color) {
      case 'yellow':
        return 'bg-amber-200/60 dark:bg-amber-900/40 rounded px-1';
      case 'blue':
        return 'bg-sky-200/60 dark:bg-sky-900/40 rounded px-1';
      case 'green':
        return 'bg-emerald-200/60 dark:bg-emerald-900/40 rounded px-1';
      case 'pink':
        return 'bg-rose-200/60 dark:bg-rose-900/40 rounded px-1';
      case 'purple':
        return 'bg-purple-200/60 dark:bg-purple-900/40 rounded px-1';
      default:
        return '';
    }
  };

  return (
    <div className={`min-h-screen ${containerBg} pb-32 transition-colors duration-200`}>
      {/* Sticky Reader Header Bar */}
      <div className={`sticky top-14 z-20 border-b backdrop-blur-md px-3 sm:px-4 py-2.5 transition-colors ${
        isDark ? 'bg-stone-900/90 border-stone-800' : isSepia ? 'bg-[#f4ecd8]/90 border-[#e2d7be]' : 'bg-white/90 border-amber-100'
      }`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Left: Back Button + Chapter Reference + Version Selector Button */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
            <button
              onClick={() => setActiveTab('bible')}
              id="reader-back-btn"
              className="p-1.5 -ml-1 rounded-xl hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center space-x-1 shrink-0 transition active:scale-95"
              title="Back to Bible Books"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <h1 className="font-serif font-bold text-sm sm:text-lg tracking-tight truncate">
              {chapterData?.chapter?.reference || 'Scripture Reader'}
            </h1>

            {/* Version Button: e.g. "KJV ▾" */}
            <button
              onClick={() => setIsVersionModalOpen(true)}
              id="reader-version-selector-btn"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/20 active:scale-95 transition shrink-0"
              title="Change Bible Version"
            >
              <span>{activeBible.abbreviation}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>            {/* Right: Listen Audio & Display Settings */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={handleToggleAudio}
                id="reader-listen-audio-btn"
                className={`p-2 px-3 rounded-2xl transition flex items-center space-x-1.5 text-xs font-bold active:scale-95 ${
                  audioState.isPlaying || audioState.isPaused
                    ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                }`}
                title="Listen to Chapter (Text-to-Speech)"
              >
                {audioState.isPlaying || audioState.isPaused ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span>{audioState.isPlaying || audioState.isPaused ? 'Stop' : 'Listen'}</span>
              </button>

              <button
                onClick={() => setShowAppearanceMenu(!showAppearanceMenu)}
                id="reader-settings-btn"
                className={`p-2 rounded-xl transition flex items-center space-x-1 text-xs font-semibold ${
                  showAppearanceMenu ? 'bg-amber-500 text-white' : 'hover:bg-amber-500/10 text-stone-600 dark:text-stone-300'
                }`}
                title="Reader & Audio Settings"
              >
                <Type className="w-4 h-4" />
                <span className="hidden md:inline">Settings</span>
              </button>
            </div>
          </div>

          {/* Reader Appearance & Audio Settings Drawer */}
          {showAppearanceMenu && (
          <div className={`border-b p-4 animate-slideDown transition-colors ${
            isDark ? 'bg-stone-900 border-stone-800' : isSepia ? 'bg-[#eee4cb] border-[#e2d7be]' : 'bg-amber-50/80 border-amber-200'
          }`}>
            <div className="max-w-2xl mx-auto space-y-4 text-xs">
              {/* Font Size Adjuster */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-500">Text Size ({readerSettings.fontSize}px):</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateSettings({ fontSize: Math.max(14, readerSettings.fontSize - 2) })}
                    className="px-3 py-1.5 rounded-xl border bg-white dark:bg-stone-800 font-bold hover:border-amber-500"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => updateSettings({ fontSize: Math.min(28, readerSettings.fontSize + 2) })}
                    className="px-3 py-1.5 rounded-xl border bg-white dark:bg-stone-800 font-bold hover:border-amber-500"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Theme Mode Selector */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-500">Reading Theme:</span>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {[
                    { id: 'system', label: 'Auto', icon: <Laptop className="w-3.5 h-3.5" /> },
                    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
                    { id: 'sepia', label: 'Sepia', icon: <Coffee className="w-3.5 h-3.5" /> },
                    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
                  ].map(t => (
                    <button
                      key={t.id}
                      id={`reader-theme-btn-${t.id}`}
                      onClick={() => updateSettings({ themeMode: t.id as any })}
                      className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                        readerSettings.themeMode === t.id
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-amber-500'
                      }`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family Selector */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-500">Font Style:</span>
                <div className="flex items-center space-x-2">
                  {[
                    { id: 'serif', label: 'Serif (Classic)' },
                    { id: 'sans', label: 'Sans (Modern)' },
                    { id: 'mono', label: 'Monospace' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => updateSettings({ fontFamily: f.id as any })}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
                        readerSettings.fontFamily === f.id
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Speed Selection */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-stone-800">
                <span className="font-semibold text-stone-500">Audio Speed:</span>
                <div className="flex items-center space-x-1">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map(sp => (
                    <button
                      key={sp}
                      onClick={() => audioService.setRate(sp)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                        audioState.rate === sp
                          ? 'bg-amber-600 text-white'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {sp}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-Play Next Chapter */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-500">Auto-play next chapter</div>
                  <div className="text-[10px] text-stone-400">Continue audio into next chapter automatically</div>
                </div>
                <button
                  onClick={() => updateSettings({ autoPlayNextChapter: !readerSettings.autoPlayNextChapter })}
                  id="reader-toggle-autoplay-btn"
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    readerSettings.autoPlayNextChapter ? 'bg-amber-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600'
                  }`}
                >
                  {readerSettings.autoPlayNextChapter ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Verse Numbers Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-800">
                <span className="font-semibold text-stone-500">Show Verse Numbers:</span>
                <button
                  onClick={() => updateSettings({ showVerseNumbers: !readerSettings.showVerseNumbers })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    readerSettings.showVerseNumbers ? 'bg-amber-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-600'
                  }`}
                >
                  {readerSettings.showVerseNumbers ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Scripture Text View */}
      <main className="max-w-2xl mx-auto px-5 py-6">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-400 font-medium">Loading {activeBible.abbreviation} Scripture...</p>
          </div>
        ) : errorMessage ? (
          <div className={`p-6 rounded-3xl border ${cardBg} text-center space-y-3 my-10`}>
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
            <div className="font-serif font-bold text-lg">{errorMessage}</div>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              You can try reloading or choosing another Bible translation like KJV or WEB.
            </p>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={loadChapter}
                className="px-4 py-2 rounded-2xl bg-amber-600 text-white text-xs font-bold shadow-xs hover:bg-amber-700 transition flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              <button
                onClick={() => setIsVersionModalOpen(true)}
                className="px-4 py-2 rounded-2xl border border-stone-300 dark:border-stone-700 text-xs font-bold"
              >
                Change Translation
              </button>
              <button
                onClick={() => setActiveTab('bible')}
                className="px-4 py-2 rounded-2xl border border-stone-300 dark:border-stone-700 text-xs font-bold"
              >
                Browse Books
              </button>
            </div>
          </div>
        ) : chapterData && chapterData.verses ? (
          <div className="space-y-6">
            {/* Chapter Header */}
            <div className="text-center pb-4 border-b border-stone-200/60 dark:border-stone-800 space-y-1.5">
              <div className="flex items-center justify-center space-x-2">
                <h2 className="font-serif text-3xl font-bold tracking-tight">
                  {chapterData.chapter.reference}
                </h2>
                <button
                  onClick={() => setIsVersionModalOpen(true)}
                  className="font-sans text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 uppercase hover:bg-amber-500/20"
                >
                  {activeBible.abbreviation}
                </button>
              </div>

              <div className="flex items-center justify-center space-x-2 pt-0.5">
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  Tap any verse to Highlight, Bookmark, or Add Note
                </p>
                {onOpenMessageOutline && (
                  <button
                    onClick={() => onOpenMessageOutline(chapterData.chapter.reference)}
                    id="reader-create-outline-btn"
                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px] font-bold transition"
                    title="Generate sermon outline from this chapter"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Create Outline</span>
                  </button>
                )}
              </div>
            </div>

            {/* Verse List */}
            <div className={spacingClass}>
              {chapterData.verses.map((verse, idx) => {
                const bookmarked = isBookmarked(verse.id);
                const hlColor = getHighlightColor(verse.id);
                const hlClass = getHighlightStyle(hlColor);
                const isAudioActiveVerse =
                  (audioState.isPlaying || audioState.isPaused) &&
                  audioState.currentVerse?.id === verse.id;

                return (
                  <span
                    key={verse.id}
                    id={`verse-${verse.id}`}
                    onClick={() => handleVerseClick(verse)}
                    className={`inline-block cursor-pointer transition-all duration-200 hover:opacity-85 ${fontClass} ${hlClass} ${
                      isAudioActiveVerse
                        ? 'ring-2 ring-amber-500 bg-amber-500/25 rounded px-1 shadow-xs font-semibold'
                        : ''
                    } group relative`}
                    style={{ fontSize: `${readerSettings.fontSize}px` }}
                  >
                    {readerSettings.showVerseNumbers && (
                      <sup className="font-sans text-[0.65em] font-bold text-amber-700 dark:text-amber-400 mr-1.5 select-none opacity-80">
                        {verse.number}
                      </sup>
                    )}
                    <span className="leading-relaxed">{verse.text} </span>
                    {bookmarked && (
                      <Bookmark className="inline w-3.5 h-3.5 text-amber-500 fill-amber-500 ml-1" />
                    )}
                  </span>
                );
              })}
            </div>

            {/* Chapter Completion Prompt Card */}
            {showCompletedPrompt && (
              <div
                id="chapter-complete-card"
                className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-3 animate-fadeIn my-6"
              >
                <div className="flex items-center space-x-2 font-serif font-bold text-base">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Chapter complete</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-sans">
                  You have finished listening to {completedRef || chapterData.chapter.reference}.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {chapterData.chapter.nextChapterId && (
                    <button
                      onClick={handleContinueToNextChapter}
                      id="continue-next-chapter-btn"
                      className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-sm transition active:scale-95 flex items-center space-x-1"
                    >
                      <span>Continue to next chapter</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowCompletedPrompt(false);
                      audioService.startChapter(
                        chapterData.verses,
                        chapterData.chapter.reference,
                        activeBible.language?.id || 'eng',
                        0
                      );
                    }}
                    id="replay-chapter-btn"
                    className="px-3.5 py-2 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs transition"
                  >
                    Replay Chapter
                  </button>
                  <button
                    onClick={() => setShowCompletedPrompt(false)}
                    className="px-3 py-2 text-stone-500 text-xs hover:text-stone-700"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Copyright Statement */}
            <ScriptureCopyright
              copyright={activeBible?.copyright}
              abbreviation={activeBible?.abbreviation}
              isPublicDomain={activeBible?.isPublicDomain}
            />

            {/* Previous & Next Chapter Controls */}
            <div className="pt-8 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
              {chapterData.chapter.previousChapterId ? (
                <button
                  onClick={() =>
                    openReader(selectedBibleId, currentBookId, chapterData.chapter.previousChapterId!)
                  }
                  id="reader-prev-chapter-btn"
                  className={`px-4 py-2.5 rounded-2xl border ${cardBg} font-medium text-xs flex items-center space-x-1.5 transition hover:border-amber-500`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Chapter</span>
                </button>
              ) : <div />}

              {chapterData.chapter.nextChapterId ? (
                <button
                  onClick={() =>
                    openReader(selectedBibleId, currentBookId, chapterData.chapter.nextChapterId!)
                  }
                  id="reader-next-chapter-btn"
                  className={`px-4 py-2.5 rounded-2xl border ${cardBg} font-medium text-xs flex items-center space-x-1.5 transition hover:border-amber-500`}
                >
                  <span>Next Chapter</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : <div />}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-stone-500">
            Chapter text could not be loaded.
          </div>
        )}
      </main>

      {/* Bible Version Selector Modal */}
      <BibleVersionSelectorModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />
    </div>
  );
};
