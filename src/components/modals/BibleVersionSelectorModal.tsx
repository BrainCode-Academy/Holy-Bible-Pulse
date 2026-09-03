import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { Bible } from '../../types';
import { Search, X, Check, Globe, BookOpen, Languages, Shield } from 'lucide-react';

interface BibleVersionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BibleVersionSelectorModal: React.FC<BibleVersionSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { bibles, selectedBibleId, setSelectedBibleId, readerSettings, isLoadingBibles } = useBible();
  const [activeTab, setActiveTab] = useState<'versions' | 'languages'>('versions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const modalBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-stone-200 text-stone-900';

  const inputBg = isDark
    ? 'bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-500'
    : isSepia
    ? 'bg-[#e8dec5] border-[#d8cbb0] text-[#302110] placeholder-[#8a7256]'
    : 'bg-stone-100 border-stone-200 text-stone-900 placeholder-stone-400';

  const cardBg = isDark
    ? 'bg-stone-800/60 border-stone-700/60 hover:border-amber-500/60'
    : isSepia
    ? 'bg-[#ebdcb9] border-[#d8c9a3] hover:border-amber-600'
    : 'bg-stone-50 border-stone-200/80 hover:border-amber-500';

  const subText = isDark ? 'text-stone-400' : isSepia ? 'text-[#6b5235]' : 'text-stone-600';

  // Extract all distinct languages with metadata
  const languageCatalogMap: Record<
    string,
    { name: string; nameLocal: string; count: number; bibles: Bible[] }
  > = {};

  bibles.forEach((b: Bible) => {
    const langName = b.language?.name || 'English';
    const local = b.language?.nameLocal || langName;
    if (!languageCatalogMap[langName]) {
      languageCatalogMap[langName] = {
        name: langName,
        nameLocal: local,
        count: 0,
        bibles: [],
      };
    }
    languageCatalogMap[langName].count += 1;
    languageCatalogMap[langName].bibles.push(b);
  });

  const languageList = Object.values(languageCatalogMap).sort((a, b) => {
    if (a.name.toLowerCase().includes('english')) return -1;
    if (b.name.toLowerCase().includes('english')) return 1;
    return a.name.localeCompare(b.name);
  });

  // Filter Bibles
  const filteredBibles = bibles.filter((b: Bible) => {
    if (selectedLanguageFilter && (b.language?.name || 'English') !== selectedLanguageFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = b.name.toLowerCase().includes(q);
    const abbrMatch = b.abbreviation.toLowerCase().includes(q);
    const langMatch = (b.language?.name || '').toLowerCase().includes(q);
    return nameMatch || abbrMatch || langMatch;
  });

  // Group Bibles by Language Name
  const groupedBibles: Record<string, Bible[]> = {};
  filteredBibles.forEach((b: Bible) => {
    const langName = b.language?.name || 'English';
    if (!groupedBibles[langName]) {
      groupedBibles[langName] = [];
    }
    groupedBibles[langName].push(b);
  });

  const sortedLanguages = Object.keys(groupedBibles).sort((a, b) => {
    if (a.toLowerCase().includes('english')) return -1;
    if (b.toLowerCase().includes('english')) return 1;
    return a.localeCompare(b);
  });

  const handleSelect = (bibleId: string) => {
    setSelectedBibleId(bibleId);
    onClose();
  };

  const handleSelectLanguage = (langName: string) => {
    setSelectedLanguageFilter(langName);
    setActiveTab('versions');
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div
        className={`w-full max-w-lg max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${modalBg}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="font-serif font-bold text-lg sm:text-xl">Bible Catalog &amp; Languages</h2>
          </div>
          <button
            onClick={onClose}
            id="close-bible-version-modal-btn"
            className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Tab Switcher: Versions vs. Languages */}
        <div className="px-4 pt-3 pb-2 border-b border-stone-200/60 dark:border-stone-800/80 shrink-0">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-xs font-bold">
            <button
              onClick={() => setActiveTab('versions')}
              id="bible-modal-versions-tab-btn"
              className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'versions'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Translations ({bibles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('languages')}
              id="bible-modal-languages-tab-btn"
              className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'languages'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Languages ({languageList.length})</span>
            </button>
          </div>
        </div>

        {/* Search Input & Active Filter */}
        <div className="p-4 border-b border-stone-200/60 dark:border-stone-800/80 shrink-0 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'versions'
                  ? 'Search versions by KJV, WEB, French, Spanish...'
                  : 'Search languages...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              id="version-search-input"
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm border outline-none transition ${inputBg}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
              >
                Clear
              </button>
            )}
          </div>

          {selectedLanguageFilter && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Filtered by:</span>
              <div className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold flex items-center space-x-1">
                <span>{selectedLanguageFilter}</span>
                <button
                  onClick={() => setSelectedLanguageFilter(null)}
                  className="hover:text-rose-500 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Versions List */}
        {activeTab === 'versions' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isLoadingBibles ? (
              <div className="py-12 text-center text-stone-400 space-y-2">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium">Loading available Bible versions...</p>
              </div>
            ) : sortedLanguages.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                No Bible translations found matching "{searchQuery}".
              </div>
            ) : (
              sortedLanguages.map(lang => (
                <div key={lang} className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center space-x-1.5 px-1">
                    <span>{lang}</span>
                    <span className="text-[10px] font-normal text-stone-400">
                      ({groupedBibles[lang].length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {groupedBibles[lang].map(b => {
                      const isSelected = b.id === selectedBibleId;
                      return (
                        <button
                          key={b.id}
                          id={`select-bible-version-${b.id}`}
                          onClick={() => handleSelect(b.id)}
                          className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                              : cardBg
                          }`}
                        >
                          <div className="space-y-0.5 pr-2 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sm">{b.abbreviation}</span>
                              {b.isPublicDomain && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                    isSelected
                                      ? 'bg-amber-600 text-amber-100'
                                      : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                                  }`}
                                >
                                  Public Domain
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                isSelected ? 'text-amber-100' : 'text-stone-700 dark:text-stone-300'
                              }`}
                            >
                              {b.name}
                            </div>
                            {b.copyright && (
                              <div
                                className={`text-[10px] truncate italic ${
                                  isSelected ? 'text-amber-200' : subText
                                }`}
                              >
                                {b.copyright}
                              </div>
                            )}
                          </div>

                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-white text-amber-600 flex items-center justify-center shrink-0">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Dedicated Languages Directory */}
        {activeTab === 'languages' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-xs font-bold text-stone-600 dark:text-stone-400 px-1 uppercase tracking-wider">
              Select Language ({languageList.length})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {languageList
                .filter(l => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return l.name.toLowerCase().includes(q) || l.nameLocal.toLowerCase().includes(q);
                })
                .map(lang => (
                  <button
                    key={lang.name}
                    id={`select-language-${lang.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleSelectLanguage(lang.name)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${cardBg}`}
                  >
                    <div>
                      <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {lang.name}
                      </div>
                      <div className={`text-xs ${subText}`}>{lang.nameLocal}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      {lang.count} {lang.count === 1 ? 'version' : 'versions'}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="p-3 border-t border-stone-200/60 dark:border-stone-800 text-[11px] text-center text-stone-500 dark:text-stone-400 bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
          Translations provided securely via API.Bible &amp; Public Domain engines.
        </div>
      </div>
    </div>
  );
};
