import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { Bible } from '../../types';
import { Search, X, Check, Globe, Shield } from 'lucide-react';

interface BibleVersionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BibleVersionSelectorModal: React.FC<BibleVersionSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { bibles, selectedBibleId, setSelectedBibleId, readerSettings, isLoadingBibles } = useBible();
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Filter Bibles by search query
  const filteredBibles = bibles.filter((b: Bible) => {
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

  // Sort versions within each language group (putting major English versions first)
  Object.keys(groupedBibles).forEach(lang => {
    groupedBibles[lang].sort((a, b) => {
      const priorityIds = [
        'de4e12af7f28f599-02', // King James Version (KJV)
        'de4e12af7f28f599-01', // KJV Ecumenical
        '55212e3cf5d04d49-01', // KJV CPB
        '9879dbb7cfe39e4d-01', // World English Bible (WEB)
        '78a9f6124f344018-01', // NIV
        'd6e14a625393b4da-01', // NLT
        'a81b73293d3080c9-01', // AMP
      ];
      const idxA = priorityIds.indexOf(a.id);
      const idxB = priorityIds.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  });

  // Sorted Language Names
  const sortedLanguages = Object.keys(groupedBibles).sort((a, b) => {
    // English first, then alphabetical
    if (a.toLowerCase().includes('english')) return -1;
    if (b.toLowerCase().includes('english')) return 1;
    return a.localeCompare(b);
  });

  const handleSelect = (bibleId: string) => {
    setSelectedBibleId(bibleId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div
        className={`w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${modalBg}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="font-serif font-bold text-lg sm:text-xl">Select Bible Version</h2>
          </div>
          <button
            onClick={onClose}
            id="close-bible-version-modal-btn"
            className="p-2 rounded-full hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-stone-200/60 dark:border-stone-800/80 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search versions by name, KJV, WEB, language..."
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
        </div>

        {/* Versions List Grouped by Language */}
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
                            : isDark
                            ? 'bg-stone-800/60 border-stone-700/60 hover:border-amber-500/60'
                            : isSepia
                            ? 'bg-[#ebdcb9] border-[#d8c9a3] hover:border-amber-600'
                            : 'bg-stone-50 border-stone-200/80 hover:border-amber-500'
                        }`}
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm">{b.abbreviation}</span>
                            {b.isPublicDomain && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  isSelected
                                    ? 'bg-amber-600 text-amber-100'
                                    : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                                }`}
                              >
                                Public Domain
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-xs ${
                              isSelected
                                ? 'text-amber-100'
                                : 'text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            {b.name}
                          </div>
                          {b.copyright && (
                            <div
                              className={`text-[10px] truncate italic ${
                                isSelected ? 'text-amber-200' : 'text-stone-400'
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

        {/* Footer Note */}
        <div className="p-3 border-t border-stone-200/60 dark:border-stone-800 text-[11px] text-center text-stone-400 bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
          Translations provided securely via API.Bible & Public Domain engines.
        </div>
      </div>
    </div>
  );
};
