import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { X, Heart, Sparkles, Plus, CheckCircle2, Trash2 } from 'lucide-react';

interface PrayerRequest {
  id: string;
  title: string;
  category: string;
  isAnswered: boolean;
  createdAt: string;
}

export const PrayerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { readerSettings } = useBible();

  const [prayers, setPrayers] = useState<PrayerRequest[]>(() => {
    try {
      const saved = localStorage.getItem('hb_prayers');
      return saved ? JSON.parse(saved) : [
        {
          id: 'p-1',
          title: 'Peace and wisdom in daily decisions',
          category: 'Guidance',
          isAnswered: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'p-2',
          title: 'Health and divine protection for my family',
          category: 'Protection',
          isAnswered: true,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        }
      ];
    } catch {
      return [];
    }
  });

  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Personal');

  const savePrayers = (updated: PrayerRequest[]) => {
    setPrayers(updated);
    localStorage.setItem('hb_prayers', JSON.stringify(updated));
  };

  const handleAddPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const updated = [
      {
        id: `p-${Date.now()}`,
        title: newTitle.trim(),
        category: newCategory,
        isAnswered: false,
        createdAt: new Date().toISOString(),
      },
      ...prayers,
    ];
    savePrayers(updated);
    setNewTitle('');
  };

  const toggleAnswered = (id: string) => {
    const updated = prayers.map(p =>
      p.id === id ? { ...p, isAnswered: !p.isAnswered } : p
    );
    savePrayers(updated);
  };

  const deletePrayer = (id: string) => {
    const updated = prayers.filter(p => p.id !== id);
    savePrayers(updated);
  };

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const modalBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-amber-100 text-stone-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-md p-5 rounded-3xl border shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between ${modalBg} animate-slideUp`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <Heart className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg">Daily Prayer Guide</h2>
              <span className="text-[11px] text-stone-400 block font-sans">
                Commit your requests to the Lord
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-500/10 text-stone-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Prayer Form */}
        <form onSubmit={handleAddPrayer} className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Add a prayer request..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm shrink-0"
            >
              Add
            </button>
          </div>
        </form>

        {/* Prayer Requests List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2 min-h-40 max-h-60">
          {prayers.length === 0 ? (
            <div className="p-6 text-center text-stone-400 text-xs space-y-1">
              <Sparkles className="w-6 h-6 text-amber-500 mx-auto opacity-50" />
              <p>No prayer requests added yet.</p>
            </div>
          ) : (
            prayers.map(p => (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition ${
                  p.isAnswered
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                    : 'bg-stone-50/60 dark:bg-stone-800/50 border-stone-200/60 dark:border-stone-700/60'
                }`}
              >
                <div className="flex items-center space-x-2.5 flex-1 pr-2">
                  <button onClick={() => toggleAnswered(p.id)} className="shrink-0">
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        p.isAnswered ? 'text-emerald-600 fill-emerald-600/20' : 'text-stone-300'
                      }`}
                    />
                  </button>
                  <span className={p.isAnswered ? 'line-through text-stone-400' : 'font-medium'}>
                    {p.title}
                  </span>
                </div>

                <button
                  onClick={() => deletePrayer(p.id)}
                  className="p-1 rounded hover:bg-rose-500/10 text-rose-500 transition shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Encouraging Scripture Footer */}
        <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 italic leading-relaxed text-center">
          "The prayer of a righteous person is powerful and effective." — James 5:16
        </div>
      </div>
    </div>
  );
};
