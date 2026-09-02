import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { PUBLIC_DOMAIN_HYMNS, searchHymns } from '../../data/hymnsData';
import { SongHymn } from '../../types';
import { Music, Search, Heart, ChevronLeft, Volume2, Share2, Sparkles, X } from 'lucide-react';

export const HymnsScreen: React.FC = () => {
  const { favoriteSongIds, toggleFavoriteSong, isFavoriteSong, setActiveTab } = useBible();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedHymn, setSelectedHymn] = useState<SongHymn | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  let hymnsList = searchHymns(searchQuery, categoryFilter);
  if (showFavoritesOnly) {
    hymnsList = hymnsList.filter(h => isFavoriteSong(h.id));
  }

  const categories = [
    'All',
    'Grace',
    'Praise',
    'Comfort',
    'Worship',
    'Faith',
    'Cross',
    'Devotion',
    'Assurance',
    'Faithfulness',
    'Salvation',
    'Prayer',
    'Thanksgiving',
  ];

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
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg leading-tight">Christian Songs & Hymns</h1>
              <p className="text-[11px] text-stone-400">Public domain classic worship lyrics</p>
            </div>
          </div>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition ${
              showFavoritesOnly
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-white' : 'text-stone-400'}`} />
            <span>Favorites ({favoriteSongIds.length})</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search Amazing Grace, How Great Thou Art, It Is Well..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:ring-2 focus:ring-amber-500 outline-none shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-500/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hymns List */}
        {hymnsList.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2 my-6">
            <Music className="w-8 h-8 text-amber-500 mx-auto opacity-60" />
            <p className="font-serif font-bold text-sm">No Hymns Found</p>
            <p className="text-xs text-stone-500">Try adjusting search keywords or category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hymnsList.map(hymn => {
              const fav = isFavoriteSong(hymn.id);
              return (
                <div
                  key={hymn.id}
                  onClick={() => setSelectedHymn(hymn)}
                  className="p-4 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs hover:border-amber-500/50 cursor-pointer transition flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        {hymn.category}
                      </span>
                      <h3 className="font-serif font-bold text-base leading-snug group-hover:text-amber-600 transition">
                        {hymn.title}
                      </h3>
                      {hymn.author && (
                        <p className="text-[11px] text-stone-500 font-sans">
                          {hymn.author} {hymn.year ? `(${hymn.year})` : ''}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavoriteSong(hymn.id);
                      }}
                      className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 transition"
                      title="Favorite"
                    >
                      <Heart className={`w-4 h-4 ${fav ? 'text-rose-500 fill-rose-500' : ''}`} />
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 font-serif italic">
                    "{hymn.lyrics.split('\n')[0]}..."
                  </p>

                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center space-x-1 pt-1">
                    <span>View Full Lyrics</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lyrics Viewer Modal */}
      {selectedHymn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-stone-900 border border-stone-800 text-stone-100 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {selectedHymn.category} • Public Domain Hymn
                </span>
                <h2 className="font-serif font-bold text-xl">{selectedHymn.title}</h2>
                {selectedHymn.author && (
                  <p className="text-xs text-stone-400 font-sans">
                    By {selectedHymn.author} {selectedHymn.year ? `(${selectedHymn.year})` : ''}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedHymn(null)}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lyrics View */}
            <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 font-serif text-sm sm:text-base leading-relaxed text-stone-200 whitespace-pre-line shadow-inner">
              {selectedHymn.lyrics}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => toggleFavoriteSong(selectedHymn.id)}
                className="px-4 py-2 rounded-2xl bg-stone-800 hover:bg-stone-700 text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFavoriteSong(selectedHymn.id) ? 'text-rose-500 fill-rose-500' : 'text-stone-400'
                  }`}
                />
                <span>{isFavoriteSong(selectedHymn.id) ? 'Saved in Favorites' : 'Add to Favorites'}</span>
              </button>

              <button
                onClick={() => setSelectedHymn(null)}
                className="px-5 py-2 rounded-2xl bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
