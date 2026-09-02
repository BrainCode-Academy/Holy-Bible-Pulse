import React, { useState, useEffect } from 'react';
import { useBible } from '../../context/BibleContext';
import { getBibleBooks, getBibleBookChapters } from '../../services/api';
import { Book } from '../../types';
import { BibleVersionSelectorModal } from '../modals/BibleVersionSelectorModal';
import {
  Search,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';

export const BibleScreen: React.FC = () => {
  const {
    bibles,
    selectedBibleId,
    openReader,
    readerSettings,
    setActiveTab,
  } = useBible();

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);
  const [booksError, setBooksError] = useState<string | null>(null);

  const [selectedBookForChapters, setSelectedBookForChapters] = useState<Book | null>(null);
  const [bookChapters, setBookChapters] = useState<Array<{ id: string; number: string; reference: string }>>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState<boolean>(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingBooks, setIsSearchingBooks] = useState<boolean>(false);

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const cardBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100 hover:border-amber-500/80'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110] hover:border-amber-600/80'
    : 'bg-white border-stone-200/80 text-stone-900 shadow-xs hover:border-amber-500/80';

  const subText = isDark ? 'text-stone-400' : isSepia ? 'text-[#705b41]' : 'text-stone-500';

  // Active Bible details
  const activeBible = bibles.find(b => b.id === selectedBibleId) || {
    id: selectedBibleId,
    abbreviation: selectedBibleId.toUpperCase(),
    name: selectedBibleId.toUpperCase(),
  };

  // Load books for selected Bible
  const loadBooks = () => {
    setIsLoadingBooks(true);
    setBooksError(null);
    getBibleBooks(selectedBibleId)
      .then(res => {
        if (!res || res.length === 0) {
          setBooksError('No books found for this translation.');
        } else {
          setBooks(res);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch books', err);
        setBooksError('Unable to load books. Please check network connection or try another translation.');
      })
      .finally(() => {
        setIsLoadingBooks(false);
      });
  };

  useEffect(() => {
    setSelectedBookForChapters(null);
    loadBooks();
  }, [selectedBibleId]);

  // Load chapters when a book is selected
  const loadChapters = () => {
    if (!selectedBookForChapters) return;
    setIsLoadingChapters(true);
    setChaptersError(null);
    getBibleBookChapters(selectedBibleId, selectedBookForChapters.id)
      .then(res => {
        setBookChapters(res);
      })
      .catch(err => {
        console.warn('Failed to fetch chapters for book', err);
        setChaptersError('Unable to load chapter list.');
      })
      .finally(() => {
        setIsLoadingChapters(false);
      });
  };

  useEffect(() => {
    if (selectedBookForChapters) {
      loadChapters();
    } else {
      setBookChapters([]);
    }
  }, [selectedBookForChapters, selectedBibleId]);

  // Separate books into Old Testament and New Testament
  const filteredBooks = books.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.abbreviation.toLowerCase().includes(q);
  });

  const oldTestamentBooks = filteredBooks.filter((b, idx) => {
    if (b.testament) return b.testament === 'OT';
    return idx < 39;
  });

  const newTestamentBooks = filteredBooks.filter((b, idx) => {
    if (b.testament) return b.testament === 'NT';
    return idx >= 39;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pt-1 pb-3 border-b border-stone-200/60 dark:border-stone-800">
        <div className="flex items-center space-x-3">
          <h1 className="font-serif text-2xl font-bold tracking-tight">Bible</h1>
          
          {/* Version Selector Button */}
          <button
            onClick={() => setIsVersionModalOpen(true)}
            id="bible-version-selector-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/20 active:scale-95 transition"
            title="Change Bible Translation"
          >
            <span>{activeBible.abbreviation}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Toggle Icon */}
          <button
            onClick={() => setIsSearchingBooks(!isSearchingBooks)}
            id="bible-screen-search-btn"
            className={`p-2 rounded-xl transition ${
              isSearchingBooks
                ? 'bg-amber-500 text-white'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title="Search Bible books or navigate to full search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Expandable Search Input Bar */}
      {isSearchingBooks && (
        <div className="relative animate-fadeIn">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search books (e.g. Genesis, Psalms, Matthew)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            id="search-books-input"
            autoFocus
            className={`w-full pl-10 pr-10 py-2.5 rounded-2xl border text-xs sm:text-sm outline-none transition ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-100 focus:border-amber-500'
                : isSepia
                ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110] focus:border-amber-600'
                : 'bg-white border-stone-200 text-stone-900 focus:border-amber-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="mt-1 flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span>Filtering books list</span>
            <button
              onClick={() => setActiveTab('search')}
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
            >
              Search Scripture Verses →
            </button>
          </div>
        </div>
      )}

      {/* Chapter Grid View when a book is picked */}
      {selectedBookForChapters ? (
        <div className="space-y-4 animate-fadeIn">
          <button
            onClick={() => setSelectedBookForChapters(null)}
            id="back-to-books-btn"
            className="flex items-center space-x-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Books</span>
          </button>

          <div className={`p-5 rounded-3xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {selectedBookForChapters.testament === 'OT' ? 'Old Testament' : 'New Testament'}
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-0.5">
                  {selectedBookForChapters.name}
                </h2>
                <p className={`text-xs mt-1 ${subText}`}>
                  {selectedBookForChapters.chaptersCount} Chapters • Version:{' '}
                  <button
                    onClick={() => setIsVersionModalOpen(true)}
                    className="font-bold text-amber-600 dark:text-amber-400 underline uppercase"
                  >
                    {activeBible.abbreviation}
                  </button>
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 shrink-0">
                <BookOpen className="w-7 h-7" />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3.5 text-stone-500">
                Select Chapter:
              </h3>

              {isLoadingChapters ? (
                <div className="py-12 text-center text-stone-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Fetching chapters...</p>
                </div>
              ) : chaptersError ? (
                <div className="py-8 text-center space-y-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                  <p className="text-xs text-stone-500">{chaptersError}</p>
                  <button
                    onClick={loadChapters}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Loading Chapters</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
                  {(bookChapters.length > 0
                    ? bookChapters
                    : Array.from({ length: selectedBookForChapters.chaptersCount }).map((_, i) => ({
                        id: `${selectedBookForChapters.id}.${i + 1}`,
                        number: `${i + 1}`,
                        reference: `${selectedBookForChapters.name} ${i + 1}`,
                      }))
                  ).map(chap => (
                    <button
                      key={chap.id}
                      id={`chapter-select-btn-${chap.id}`}
                      onClick={() => {
                        openReader(
                          selectedBibleId,
                          selectedBookForChapters.id,
                          chap.id,
                          chap.reference
                        );
                        setSelectedBookForChapters(null);
                      }}
                      className={`aspect-square rounded-2xl border font-serif font-bold text-sm sm:text-base flex items-center justify-center transition transform active:scale-95 shadow-2xs ${
                        isDark
                          ? 'border-stone-800 bg-stone-800/80 hover:bg-amber-500 hover:text-white hover:border-amber-500'
                          : isSepia
                          ? 'border-[#e0d4ba] bg-[#ebdcb9] hover:bg-amber-600 hover:text-white hover:border-amber-600'
                          : 'border-stone-200 bg-stone-50 hover:bg-amber-500 hover:text-white hover:border-amber-500'
                      }`}
                    >
                      {chap.number}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Main Books List divided into Old Testament and New Testament */
        <main className="space-y-8">
          {isLoadingBooks ? (
            <div className="py-20 text-center text-stone-400 space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Loading Bible books for {activeBible.abbreviation}...</p>
            </div>
          ) : booksError ? (
            <div className="py-16 text-center space-y-4 max-w-sm mx-auto p-6 rounded-3xl border border-stone-200 dark:border-stone-800">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <div className="font-serif font-bold text-lg">{booksError}</div>
              <p className="text-xs text-stone-500">
                You can try reloading or choosing a public domain translation like KJV or WEB.
              </p>
              <div className="flex justify-center space-x-2 pt-2">
                <button
                  onClick={loadBooks}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                <button
                  onClick={() => setIsVersionModalOpen(true)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold"
                >
                  Change Version
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* OLD TESTAMENT SECTION */}
              {oldTestamentBooks.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800 pb-2">
                    <h2 className="text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400 flex items-center space-x-2">
                      <span>OLD TESTAMENT</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        ({oldTestamentBooks.length} Books)
                      </span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {oldTestamentBooks.map(book => (
                      <div
                        key={book.id}
                        id={`book-card-${book.id}`}
                        onClick={() => setSelectedBookForChapters(book)}
                        className={`p-3.5 rounded-2xl border ${cardBg} cursor-pointer transition flex items-center justify-between group transform active:scale-98`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs group-hover:bg-amber-500 group-hover:text-white transition">
                            {book.abbreviation}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{book.name}</div>
                            <div className={`text-[11px] ${subText}`}>
                              {book.chaptersCount} Chapters
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* NEW TESTAMENT SECTION */}
              {newTestamentBooks.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800 pb-2">
                    <h2 className="text-xs font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400 flex items-center space-x-2">
                      <span>NEW TESTAMENT</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        ({newTestamentBooks.length} Books)
                      </span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {newTestamentBooks.map(book => (
                      <div
                        key={book.id}
                        id={`book-card-${book.id}`}
                        onClick={() => setSelectedBookForChapters(book)}
                        className={`p-3.5 rounded-2xl border ${cardBg} cursor-pointer transition flex items-center justify-between group transform active:scale-98`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs group-hover:bg-amber-500 group-hover:text-white transition">
                            {book.abbreviation}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{book.name}</div>
                            <div className={`text-[11px] ${subText}`}>
                              {book.chaptersCount} Chapters
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {filteredBooks.length === 0 && (
                <div className="py-12 text-center text-stone-400 text-xs">
                  No Bible books found matching "{searchQuery}".
                </div>
              )}
            </>
          )}
        </main>
      )}

      {/* Bible Version Selector Modal */}
      <BibleVersionSelectorModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />
    </div>
  );
};
