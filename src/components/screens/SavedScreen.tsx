import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { Note } from '../../types';
import { PUBLIC_DOMAIN_HYMNS } from '../../data/hymnsData';
import { DAILY_DEVOTIONALS } from '../../data/devotionalsData';
import { AdBanner } from '../common/AdBanner';
import {
  Bookmark as BookmarkIcon,
  Highlighter,
  FileText,
  Trash2,
  Edit3,
  Plus,
  ArrowRight,
  HeartHandshake,
  BookOpen,
  Music,
  Sun,
  ChevronRight,
  Heart,
  Share2,
} from 'lucide-react';

export const SavedScreen: React.FC<{
  onOpenNoteModal: (note?: Note) => void;
}> = ({ onOpenNoteModal }) => {
  const {
    bookmarks,
    toggleBookmark,
    highlights,
    removeHighlight,
    notes,
    deleteNote,
    openReader,
    selectedBibleId,
    bibles,
    readerSettings,
    favoriteSongIds,
    toggleFavoriteSong,
    setActiveTab: setGlobalActiveTab,
  } = useBible();

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'highlights' | 'notes' | 'hymns' | 'devotionals'>('bookmarks');
  const [selectedHymnLyrics, setSelectedHymnLyrics] = useState<string | null>(null);

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const cardBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-amber-100/80 text-stone-900 shadow-sm';

  const subText = isDark ? 'text-stone-400' : isSepia ? 'text-[#705b41]' : 'text-stone-500';

  const favoriteHymnsList = PUBLIC_DOMAIN_HYMNS.filter(h => favoriteSongIds.includes(h.id));

  const getColorPill = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'bg-amber-400/30 text-amber-900 dark:text-amber-200 border-amber-400/50';
      case 'blue':
        return 'bg-sky-400/30 text-sky-900 dark:text-sky-200 border-sky-400/50';
      case 'green':
        return 'bg-emerald-400/30 text-emerald-900 dark:text-emerald-200 border-emerald-400/50';
      case 'pink':
        return 'bg-rose-400/30 text-rose-900 dark:text-rose-200 border-rose-400/50';
      case 'purple':
        return 'bg-purple-400/30 text-purple-900 dark:text-purple-200 border-purple-400/50';
      default:
        return 'bg-amber-400/30 text-amber-900 border-amber-400/50';
    }
  };

  const getBibleName = (bibleId?: string) => {
    if (!bibleId) return selectedBibleId.toUpperCase();
    const found = bibles.find(b => b.id === bibleId);
    return found ? found.abbreviation : bibleId.toUpperCase();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Quick Spiritual Tools Hub Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { id: 'prayer', label: 'Prayer Journal', sub: 'Intercession & praises', icon: <HeartHandshake className="w-4 h-4 text-amber-500" /> },
          { id: 'dictionary', label: 'Bible Dictionary', sub: 'Theological definitions', icon: <BookOpen className="w-4 h-4 text-sky-500" /> },
          { id: 'hymns', label: 'Songs & Hymns', sub: '50 classic lyrics', icon: <Music className="w-4 h-4 text-rose-500" /> },
          { id: 'devotional', label: 'Daily Devotional', sub: 'Scripture reflection', icon: <Sun className="w-4 h-4 text-amber-400" /> },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setGlobalActiveTab(item.id as any)}
            className={`p-3.5 rounded-2xl border ${cardBg} text-left transition flex items-center justify-between group hover:border-amber-500/50 active:scale-95`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 font-bold text-xs group-hover:text-amber-600 transition">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <p className={`text-[10px] ${subText}`}>{item.sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition" />
          </button>
        ))}
      </div>

      {/* AdMob Banner for Saved Sanctuary */}
      <AdBanner placement="saved" />

      {/* Header Tabs */}
      <div className={`p-4 rounded-3xl border ${cardBg} space-y-3`}>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-xl font-bold">Saved Sanctuary</h1>
          {activeTab === 'notes' && (
            <button
              onClick={() => onOpenNoteModal()}
              id="saved-add-note-button"
              className="px-3 py-1.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center space-x-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'bookmarks', label: `Bookmarks (${bookmarks.length})`, icon: <BookmarkIcon className="w-3.5 h-3.5" /> },
            { id: 'highlights', label: `Highlights (${highlights.length})`, icon: <Highlighter className="w-3.5 h-3.5" /> },
            { id: 'notes', label: `Notes (${notes.length})`, icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'hymns', label: `Hymns (${favoriteHymnsList.length})`, icon: <Music className="w-3.5 h-3.5" /> },
            { id: 'devotionals', label: 'Devotionals', icon: <Sun className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 py-2 px-3 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks Tab View */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-3">
          {bookmarks.length === 0 ? (
            <div className={`p-8 rounded-3xl border ${cardBg} text-center space-y-2`}>
              <BookmarkIcon className="w-8 h-8 text-amber-500 mx-auto opacity-50" />
              <p className="text-sm font-semibold">No bookmarks saved yet.</p>
              <p className={`text-xs ${subText}`}>
                Tap any verse while reading in the Bible Reader to bookmark it.
              </p>
            </div>
          ) : (
            bookmarks.map(bm => {
              const parts = bm.verseId.split('.');
              const bookId = parts[0];
              const chapId = `${parts[0]}.${parts[1]}`;
              const bibleVer = getBibleName(bm.bibleId);
              return (
                <div key={bm.id} className={`p-4 rounded-2xl border ${cardBg} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => openReader(bm.bibleId || selectedBibleId, bookId, chapId, bm.reference, bm.verseId)}
                      className="font-serif font-bold text-sm text-amber-700 dark:text-amber-400 hover:underline flex items-center space-x-1.5"
                    >
                      <span>{bm.reference}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300">
                        {bibleVer}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>

                    <button
                      onClick={() => toggleBookmark(bm.verseId, bm.reference, bm.text, bm.bibleId)}
                      className="p-1.5 rounded-xl hover:bg-rose-500/10 text-rose-500 transition"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="font-serif text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                    "{bm.text}"
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Highlights Tab View */}
      {activeTab === 'highlights' && (
        <div className="space-y-3">
          {highlights.length === 0 ? (
            <div className={`p-8 rounded-3xl border ${cardBg} text-center space-y-2`}>
              <Highlighter className="w-8 h-8 text-amber-500 mx-auto opacity-50" />
              <p className="text-sm font-semibold">No highlighted verses yet.</p>
              <p className={`text-xs ${subText}`}>
                Highlight key scripture passages in yellow, blue, green, pink, or purple!
              </p>
            </div>
          ) : (
            highlights.map(hl => {
              const parts = hl.verseId.split('.');
              const bookId = parts[0];
              const chapId = `${parts[0]}.${parts[1]}`;
              return (
                <div key={hl.id} className={`p-4 rounded-2xl border ${cardBg} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => openReader(selectedBibleId, bookId, chapId, hl.reference, hl.verseId)}
                      className="font-serif font-bold text-sm text-amber-700 dark:text-amber-400 hover:underline flex items-center space-x-1"
                    >
                      <span>{hl.reference}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getColorPill(hl.color)}`}>
                        {hl.color}
                      </span>
                      <button
                        onClick={() => removeHighlight(hl.verseId)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/10 text-rose-500 transition"
                        title="Remove Highlight"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="font-serif text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                    "{hl.textSnippet}"
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Notes Tab View */}
      {activeTab === 'notes' && (
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className={`p-8 rounded-3xl border ${cardBg} text-center space-y-2`}>
              <FileText className="w-8 h-8 text-amber-500 mx-auto opacity-50" />
              <p className="text-sm font-semibold">No personal notes created yet.</p>
              <p className={`text-xs ${subText}`}>
                Record study insights, prayer points, and reflections.
              </p>
              <button
                onClick={() => onOpenNoteModal()}
                className="mt-3 px-4 py-2 rounded-2xl bg-amber-600 text-white font-semibold text-xs inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Note</span>
              </button>
            </div>
          ) : (
            notes.map(note => (
              <div key={note.id} className={`p-5 rounded-2xl border ${cardBg} space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base">{note.title}</h3>
                    {note.reference && (
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Reference: {note.reference}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onOpenNoteModal(note)}
                      className="p-2 rounded-xl hover:bg-amber-500/10 text-stone-500 transition"
                      title="Edit Note"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-500 transition"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs leading-relaxed whitespace-pre-line text-stone-700 dark:text-stone-300">
                  {note.content}
                </p>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {note.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Favorite Hymns Tab View */}
      {activeTab === 'hymns' && (
        <div className="space-y-3">
          {favoriteHymnsList.length === 0 ? (
            <div className={`p-8 rounded-3xl border ${cardBg} text-center space-y-2`}>
              <Music className="w-8 h-8 text-rose-500 mx-auto opacity-50" />
              <p className="text-sm font-semibold">No favorite hymns saved yet.</p>
              <p className={`text-xs ${subText}`}>
                Explore the 50 classic offline hymns catalog and tap the heart icon to save your favorites!
              </p>
              <button
                onClick={() => setGlobalActiveTab('hymns')}
                className="mt-3 px-4 py-2 rounded-2xl bg-amber-600 text-white font-semibold text-xs inline-flex items-center space-x-1.5"
              >
                <Music className="w-4 h-4" />
                <span>Browse Hymn Collection</span>
              </button>
            </div>
          ) : (
            favoriteHymnsList.map(hymn => (
              <div key={hymn.id} className={`p-4 rounded-2xl border ${cardBg} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base">{hymn.title}</h3>
                    <p className={`text-xs ${subText}`}>
                      {hymn.author} {hymn.year ? `• ${hymn.year}` : ''} • {hymn.category}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleFavoriteSong(hymn.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-500/10 text-rose-500 transition"
                      title="Remove Favorite"
                    >
                      <Heart className="w-4 h-4 fill-rose-500" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50/60 dark:bg-stone-800/40 text-xs font-serif leading-relaxed line-clamp-4 whitespace-pre-line text-stone-700 dark:text-stone-300">
                  {hymn.lyrics}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setGlobalActiveTab('hymns')}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <span>View in Hymns Sanctuary</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Devotionals Tab View */}
      {activeTab === 'devotionals' && (
        <div className="space-y-3">
          <div className={`p-5 rounded-3xl border ${cardBg} space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sun className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-base">Daily Devotionals Library</h3>
              </div>
              <button
                onClick={() => setGlobalActiveTab('devotional')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Today's Reflection →
              </button>
            </div>
            <p className={`text-xs ${subText}`}>
              Explore scripture devotionals, theological reflections, and daily guided prayers.
            </p>
          </div>

          <div className="space-y-2.5">
            {DAILY_DEVOTIONALS.map(dev => (
              <div key={dev.id} className={`p-4 rounded-2xl border ${cardBg} space-y-2`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {dev.scripturalReference}
                    </span>
                    <h4 className="font-serif font-bold text-sm">{dev.title}</h4>
                  </div>

                  <button
                    onClick={() => setGlobalActiveTab('devotional')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold transition"
                  >
                    Open Devotional
                  </button>
                </div>

                <p className="text-xs font-serif italic text-stone-600 dark:text-stone-300 line-clamp-2">
                  "{dev.keyVerseText}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
