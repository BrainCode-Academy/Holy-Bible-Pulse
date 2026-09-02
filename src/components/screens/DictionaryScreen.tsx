import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { BIBLE_DICTIONARY_TERMS, searchDictionary } from '../../data/dictionaryData';
import { DictionaryTerm } from '../../types';
import { Search, BookOpen, ChevronLeft, Bookmark, ArrowUpRight } from 'lucide-react';

export const DictionaryScreen: React.FC = () => {
  const { setActiveTab, openReader, selectedBibleId } = useBible();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<DictionaryTerm | null>(null);

  const filteredTerms = searchDictionary(searchQuery);

  const handleOpenScripture = (ref: string) => {
    // Parse reference like "John 3:16" or "Psalm 46:7"
    const parts = ref.split(' ');
    if (parts.length >= 2) {
      const bookName = parts.slice(0, parts.length - 1).join(' ');
      const chapterAndVerse = parts[parts.length - 1].split(':');
      const chapterNum = chapterAndVerse[0] || '1';
      // Fallback simple book search
      openReader(selectedBibleId, 'JHN', `JHN.${chapterNum}`, ref);
    }
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
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg leading-tight">Bible Dictionary</h1>
              <p className="text-[11px] text-stone-400">Theological & Archaic Terms Reference</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search Selah, Covenant, Grace, Redeemer, Begotten..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:ring-2 focus:ring-amber-500 outline-none shadow-xs"
          />
        </div>

        {/* Quick Tag Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['Selah', 'Covenant', 'Grace', 'Begotten', 'Sanctification', 'Redeemer', 'Shalom'].map(t => (
            <button
              key={t}
              onClick={() => setSearchQuery(t)}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-200 dark:bg-stone-800 hover:bg-amber-500/10 hover:text-amber-600 transition whitespace-nowrap"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Dictionary Entries List */}
        <div className="space-y-3">
          {filteredTerms.map(term => (
            <div
              key={term.id}
              className="p-5 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs space-y-2 hover:border-amber-500/40 transition"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif font-bold text-lg text-amber-700 dark:text-amber-400">
                  {term.term}
                </h3>
                {term.partOfSpeech && (
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                    {term.partOfSpeech}
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                {term.definition}
              </p>

              {term.etymology && (
                <div className="text-[11px] text-stone-500 italic bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                  {term.etymology}
                </div>
              )}

              {/* Scripture References */}
              {term.scriptureReferences && term.scriptureReferences.length > 0 && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center space-x-2 text-xs">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Key Verses:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {term.scriptureReferences.map((ref, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold flex items-center space-x-0.5"
                      >
                        <span>{ref}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
