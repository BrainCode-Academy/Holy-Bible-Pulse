import React, { useState, useEffect } from 'react';
import { useBible } from '../../context/BibleContext';
import { searchScripture } from '../../services/api';
import { Verse } from '../../types';
import { Search, X, History, Trash2, ArrowRight, AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';
import { BibleVersionSelectorModal } from '../modals/BibleVersionSelectorModal';
import { AdBanner } from '../common/AdBanner';

const TOPICAL_TAGS = [
  'Peace',
  'Faith',
  'Love',
  'Hope',
  'Anxiety',
  'Strength',
  'Healing',
  'Forgiveness',
  'Salvation',
  'Wisdom',
  'Comfort',
  'Joy',
];

const RECENT_SEARCHES_KEY = 'hb_recent_searches';

export const SearchScreen: React.FC = () => {
  const { selectedBibleId, bibles, openReader, readerSettings } = useBible();
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Verse[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);

  const PAGE_LIMIT = 25;

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const cardBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-amber-100/80 text-stone-900 shadow-sm';

  const subText = isDark ? 'text-stone-400' : isSepia ? 'text-[#705b41]' : 'text-stone-500';

  // Active Bible details
  const activeBible = bibles.find(b => b.id === selectedBibleId) || {
    id: selectedBibleId,
    abbreviation: selectedBibleId.toUpperCase(),
    name: selectedBibleId.toUpperCase(),
  };

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Save query to search history
  const saveToHistory = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const filtered = recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 10);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Remove single item from history
  const removeFromHistory = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Clear all history
  const clearHistory = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Execute Search
  const handleSearch = async (searchQuery: string, offset = 0, isAppend = false) => {
    const term = searchQuery.trim();
    if (!term) return;

    if (!isAppend) {
      setIsSearching(true);
      setHasSearched(true);
      setSearchError(null);
      setResults([]);
      setCurrentOffset(0);
      saveToHistory(term);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const res = await searchScripture(term, selectedBibleId, PAGE_LIMIT, offset);
      setTotalCount(res.total || res.verses.length);

      if (isAppend) {
        setResults(prev => [...prev, ...res.verses]);
      } else {
        setResults(res.verses);
      }
      setCurrentOffset(offset);
    } catch (err: any) {
      console.warn('Search error', err);
      setSearchError(err?.message || 'Failed to perform search. Please check your network and try again.');
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  // Re-run search if user changes translation
  useEffect(() => {
    if (hasSearched && query.trim()) {
      handleSearch(query, 0, false);
    }
  }, [selectedBibleId]);

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    handleSearch(tag, 0, false);
  };

  const handleLoadMore = () => {
    const nextOffset = currentOffset + PAGE_LIMIT;
    handleSearch(query, nextOffset, true);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Search Header & Version Selector */}
      <div className={`p-5 rounded-3xl border ${cardBg} space-y-3.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Complete Bible Search
            </span>
          </div>

          {/* Translation Picker Button */}
          <button
            onClick={() => setIsVersionModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-bold transition"
            id="search-translation-picker"
          >
            <span>{activeBible.abbreviation}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSearch(query, 0, false);
          }}
          className="flex items-center space-x-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search words, phrases, or references (e.g. 'peace', 'bread of life', 'John 3:16')..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              id="search-input-field"
              className={`w-full pl-4 pr-9 py-3 rounded-2xl border text-sm outline-none transition ${
                isDark
                  ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-amber-500'
                  : isSepia
                  ? 'bg-[#fbf7ee] border-[#e2d7be] text-[#302110] focus:border-amber-600'
                  : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-amber-500'
              }`}
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setHasSearched(false);
                  setResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            id="search-submit-button"
            disabled={isSearching || !query.trim()}
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold text-xs shadow-md shadow-amber-600/20 disabled:opacity-50 transition flex items-center space-x-1.5"
          >
            {isSearching ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <span>Search</span>
            )}
          </button>
        </form>

        {/* Recent Searches Section (when empty or before search) */}
        {recentSearches.length > 0 && !hasSearched && (
          <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              <div className="flex items-center space-x-1">
                <History className="w-3 h-3" />
                <span>Recent Searches</span>
              </div>
              <button
                onClick={clearHistory}
                className="text-stone-400 hover:text-amber-600 transition flex items-center space-x-0.5 lowercase"
              >
                <Trash2 className="w-3 h-3" />
                <span>clear</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.map(term => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    handleSearch(term, 0, false);
                  }}
                  className="group flex items-center space-x-1 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-amber-500/10 text-stone-700 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-300 text-xs font-medium transition"
                >
                  <span>{term}</span>
                  <span
                    onClick={e => removeFromHistory(term, e)}
                    className="opacity-40 group-hover:opacity-100 p-0.5 rounded-full hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-500"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Topics & Themes */}
        <div className="pt-1">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Explore Topics & Themes:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TOPICAL_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-medium transition"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AdMob Banner for Search */}
      <AdBanner placement="search" />

      {/* Initial Landing Graphic / Guidance */}
      {!hasSearched && !isSearching && (
        <div className={`p-8 rounded-3xl border ${cardBg} text-center space-y-3`}>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold">Search God's Word</h3>
          <p className={`text-xs ${subText} max-w-sm mx-auto leading-relaxed`}>
            Search free-text keywords (e.g. <span className="font-semibold text-amber-700 dark:text-amber-400">"bread of life"</span>, <span className="font-semibold text-amber-700 dark:text-amber-400">"peace"</span>), or direct Bible references (e.g. <span className="font-semibold text-amber-700 dark:text-amber-400">"John 3:16"</span>, <span className="font-semibold text-amber-700 dark:text-amber-400">"Psalm 23:1"</span>).
          </p>
        </div>
      )}

      {/* Search Error State */}
      {searchError && (
        <div className={`p-6 rounded-3xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-center space-y-3`}>
          <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
          <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">{searchError}</p>
          <button
            onClick={() => handleSearch(query, 0, false)}
            className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition inline-flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Search</span>
          </button>
        </div>
      )}

      {/* Search Loading State */}
      {isSearching && (
        <div className="py-16 text-center text-stone-400 space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Searching {activeBible.abbreviation} for "{query}"...</p>
        </div>
      )}

      {/* Search Results Display */}
      {!isSearching && hasSearched && !searchError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 px-1">
            <span>
              Showing {results.length} of {totalCount} {totalCount === 1 ? 'Result' : 'Results'} for "{query}"
            </span>
            <span className="uppercase text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
              {activeBible.abbreviation}
            </span>
          </div>

          {results.length === 0 ? (
            <div className={`p-8 rounded-3xl border ${cardBg} text-center space-y-2`}>
              <p className="text-sm font-semibold">No verses found for "{query}".</p>
              <p className={`text-xs ${subText} max-w-sm mx-auto`}>
                Try searching for broader words like "love", "light", "peace", or double check your Bible reference spelling.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((verse, idx) => {
                const bookId = verse.bookId || verse.chapterId.split('.')[0] || 'GEN';
                return (
                  <div
                    key={`${verse.id}-${idx}`}
                    onClick={() => openReader(selectedBibleId, bookId, verse.chapterId, verse.reference, verse.id)}
                    className={`p-4 rounded-2xl border ${cardBg} cursor-pointer hover:border-amber-500 transition space-y-2 transform active:scale-98 group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-bold text-sm text-amber-700 dark:text-amber-400 group-hover:underline">
                          {verse.reference}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {activeBible.abbreviation}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
                    </div>
                    <p className="font-serif text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                      "{verse.text}"
                    </p>
                  </div>
                );
              })}

              {/* Load More Button if totalCount > results.length */}
              {results.length < totalCount && (
                <div className="pt-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full py-3.5 rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs transition flex items-center justify-center space-x-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                        <span>Loading More Verses...</span>
                      </>
                    ) : (
                      <span>Load More Results ({results.length} of {totalCount})</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Version Selector Modal */}
      <BibleVersionSelectorModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />
    </div>
  );
};
