import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { Verse, Highlight } from '../../types';
import {
  Bookmark as BookmarkIcon,
  Highlighter,
  FileText,
  Share2,
  Volume2,
  Copy,
  X,
  Check,
  BookOpen,
} from 'lucide-react';

export const VerseContextMenuModal: React.FC<{
  verse: Verse | null;
  onClose: () => void;
  onOpenNote: (reference: string, verseId: string) => void;
  onOpenShare: (text: string, reference: string) => void;
}> = ({ verse, onClose, onOpenNote, onOpenShare }) => {
  if (!verse) return null;

  const {
    toggleBookmark,
    isBookmarked,
    addHighlight,
    removeHighlight,
    getHighlightColor,
    readerSettings,
    setActiveTab,
    selectedBibleId,
  } = useBible();

  const [copied, setCopied] = useState<boolean>(false);
  const bookmarked = isBookmarked(verse.id);
  const activeHlColor = getHighlightColor(verse.id);

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const modalBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-amber-100 text-stone-900';

  const handleHighlight = (color: Highlight['color']) => {
    if (activeHlColor === color) {
      removeHighlight(verse.id);
    } else {
      addHighlight(verse.id, verse.reference, color, verse.text);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${verse.text}" — ${verse.reference}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${verse.reference}. ${verse.text}`);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const highlightColors: Array<{ id: Highlight['color']; label: string; bg: string; border: string }> = [
    { id: 'yellow', label: 'Yellow', bg: 'bg-amber-400', border: 'border-amber-500' },
    { id: 'blue', label: 'Blue', bg: 'bg-sky-400', border: 'border-sky-500' },
    { id: 'green', label: 'Green', bg: 'bg-emerald-400', border: 'border-emerald-500' },
    { id: 'pink', label: 'Pink', bg: 'bg-rose-400', border: 'border-rose-500' },
    { id: 'purple', label: 'Purple', bg: 'bg-purple-400', border: 'border-purple-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-md p-5 rounded-t-3xl sm:rounded-3xl border shadow-2xl space-y-4 ${modalBg} animate-slideUp`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-800">
          <div>
            <span className="font-serif font-bold text-base text-amber-700 dark:text-amber-400">
              {verse.reference}
            </span>
            <span className="text-[11px] text-stone-400 block font-sans">Verse Actions</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-500/10 text-stone-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verse Text Snippet */}
        <blockquote className="font-serif italic text-xs leading-relaxed text-stone-700 dark:text-stone-300 bg-stone-50/60 dark:bg-stone-800/50 p-3 rounded-2xl border border-stone-200/40 dark:border-stone-700/40 line-clamp-3">
          "{verse.text}"
        </blockquote>

        {/* Highlight Color Picker (4+ Colors: Yellow, Blue, Green, Pink, Purple) */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-stone-500 flex items-center space-x-1">
            <Highlighter className="w-3.5 h-3.5 text-amber-600" />
            <span>Highlight Color:</span>
          </span>
          <div className="flex items-center space-x-3">
            {highlightColors.map(c => {
              const isSelected = activeHlColor === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleHighlight(c.id)}
                  className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition transform active:scale-90 ${
                    isSelected ? 'ring-2 ring-stone-900 dark:ring-white scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={c.label}
                >
                  {isSelected && <Check className="w-4 h-4 text-stone-900" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {/* Bookmark */}
          <button
            onClick={() => toggleBookmark(verse.id, verse.reference, verse.text, selectedBibleId)}
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center space-x-2 transition ${
              bookmarked
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-amber-400'
            }`}
          >
            <BookmarkIcon className={`w-4 h-4 ${bookmarked ? 'fill-white' : ''}`} />
            <span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          {/* Add Note */}
          <button
            onClick={() => {
              onClose();
              onOpenNote(verse.reference, verse.id);
            }}
            className="p-3 rounded-2xl border bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-amber-400 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Add Note</span>
          </button>

          {/* Share */}
          <button
            onClick={() => {
              onClose();
              onOpenShare(verse.text, verse.reference);
            }}
            className="p-3 rounded-2xl border bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-amber-400 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <Share2 className="w-4 h-4 text-amber-600" />
            <span>Share Card</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-3 rounded-2xl border bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-amber-400 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <Copy className="w-4 h-4 text-amber-600" />
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
        </div>

        {/* Bottom Actions Row: Audio & Dictionary Lookup */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleSpeak}
            className="py-2.5 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold text-xs flex items-center justify-center space-x-2 transition hover:bg-amber-100/80"
          >
            <Volume2 className="w-4 h-4" />
            <span>Audio Verse</span>
          </button>

          <button
            onClick={() => {
              onClose();
              setActiveTab('dictionary');
            }}
            className="py-2.5 px-3 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs flex items-center justify-center space-x-2 transition hover:bg-stone-200 dark:hover:bg-stone-700"
          >
            <BookOpen className="w-4 h-4 text-sky-500" />
            <span>Bible Dictionary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
