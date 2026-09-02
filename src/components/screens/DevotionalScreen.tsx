import React from 'react';
import { useBible } from '../../context/BibleContext';
import { getTodayDevotional, DAILY_DEVOTIONALS } from '../../data/devotionalsData';
import { Sun, Calendar, BookOpen, Heart, Sparkles, ChevronLeft, Share2 } from 'lucide-react';

export const DevotionalScreen: React.FC = () => {
  const { setActiveTab, openReader, selectedBibleId } = useBible();
  const todayDevotional = getTodayDevotional();

  const handleReadScripture = () => {
    // Navigate directly into Bible Reader for Philippians 4
    openReader(selectedBibleId, 'PHP', 'PHP.4', 'Philippians 4:6-7');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-28">
      {/* Header */}
      <header className="sticky top-14 z-20 bg-stone-900 text-stone-100 px-4 py-3 border-b border-stone-800 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('saved')}
              className="p-1 -ml-1 text-amber-400 hover:text-amber-300 transition"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg leading-tight">Daily Devotional</h1>
              <p className="text-[11px] text-stone-400">Daily scripture reflections & prayers</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Today Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-tr from-stone-900 via-amber-950 to-stone-900 text-stone-100 shadow-xl border border-stone-800 space-y-5">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Today’s Reflection</span>
            </div>
            <span className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-amber-100 leading-tight">
              {todayDevotional.title}
            </h2>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300">
              <span>Key Scripture: {todayDevotional.scripturalReference}</span>
            </div>
          </div>

          {/* Scripture Quote Box */}
          <blockquote className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 font-serif text-sm sm:text-base italic text-amber-100/90 leading-relaxed">
            "{todayDevotional.keyVerseText}"
          </blockquote>

          <button
            onClick={handleReadScripture}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>Read Full Chapter in Bible</span>
          </button>
        </div>

        {/* Devotional Reflection Article */}
        <article className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-lg text-amber-800 dark:text-amber-400">
            Devotional Reflection
          </h3>

          <div className="font-sans text-sm sm:text-base leading-relaxed text-stone-700 dark:text-stone-300 space-y-4 whitespace-pre-line">
            {todayDevotional.content}
          </div>

          {/* Guided Prayer Box */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 mt-6">
            <div className="flex items-center space-x-2 font-serif font-bold text-amber-800 dark:text-amber-300 text-sm">
              <Heart className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Today’s Guided Prayer</span>
            </div>
            <p className="font-serif italic text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
              "{todayDevotional.prayer}"
            </p>
          </div>
        </article>

        {/* Devotional History Archives */}
        <section className="space-y-3">
          <h3 className="font-serif font-bold text-base text-stone-700 dark:text-stone-300">
            Recent Devotionals
          </h3>
          <div className="space-y-2">
            {DAILY_DEVOTIONALS.map(dev => (
              <div
                key={dev.id}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                    {dev.scripturalReference}
                  </div>
                  <div className="font-serif font-bold text-sm">{dev.title}</div>
                </div>

                <button
                  onClick={() => openReader(selectedBibleId, 'PHP', 'PHP.4', dev.scripturalReference)}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/10 text-stone-700 dark:text-stone-300 text-xs font-bold transition"
                >
                  Read
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
