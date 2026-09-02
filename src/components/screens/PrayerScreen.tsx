import React, { useState } from 'react';
import { useBible } from '../../context/BibleContext';
import { PrayerStatus, PrayerRequest } from '../../types';
import {
  HeartHandshake,
  Plus,
  CheckCircle2,
  Trash2,
  Archive,
  Sparkles,
  Calendar,
  Tag,
  ChevronLeft,
  X,
  Flame,
  Edit3,
} from 'lucide-react';

export const PrayerScreen: React.FC = () => {
  const { prayers, addPrayer, updatePrayerStatus, deletePrayer, incrementPrayerCount, setActiveTab } = useBible();
  const [filterStatus, setFilterStatus] = useState<PrayerStatus | 'all'>('active');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Personal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredPrayers = prayers.filter(p => (filterStatus === 'all' ? true : p.status === filterStatus));

  const handleOpenCreateModal = () => {
    setEditingPrayerId(null);
    setTitle('');
    setDescription('');
    setCategory('Personal');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (prayer: PrayerRequest) => {
    setEditingPrayerId(prayer.id);
    setTitle(prayer.title);
    setDescription(prayer.description || '');
    setCategory(prayer.category || 'Personal');
    setIsAddModalOpen(true);
  };

  const handleSavePrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingPrayerId) {
      // Update existing prayer in state
      deletePrayer(editingPrayerId);
      addPrayer(title.trim(), description.trim(), category);
      triggerToast('Prayer request updated successfully!');
    } else {
      addPrayer(title.trim(), description.trim(), category);
      triggerToast('Prayer request saved to your private journal!');
    }

    setTitle('');
    setDescription('');
    setEditingPrayerId(null);
    setIsAddModalOpen(false);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleIPrayed = (id: string) => {
    incrementPrayerCount(id);
    triggerToast('Prayed today! May God hear your petition.');
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
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg leading-tight">Prayer Requests</h1>
              <p className="text-[11px] text-stone-400">Private, secure intercession journal</p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center space-x-1.5 shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-amber-500 text-stone-950 font-bold text-xs shadow-xl flex items-center space-x-2 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'active', label: `Active (${prayers.filter(p => p.status === 'active').length})` },
            { id: 'answered', label: `Answered (${prayers.filter(p => p.status === 'answered').length})` },
            { id: 'archived', label: `Archived (${prayers.filter(p => p.status === 'archived').length})` },
            { id: 'all', label: `All Items (${prayers.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-500/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Prayer List */}
        {filteredPrayers.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3 my-6">
            <HeartHandshake className="w-10 h-10 text-amber-500 mx-auto opacity-70" />
            <h3 className="font-serif font-bold text-base">No Prayer Requests Found</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Bring your petitions and thanksgiving to the Lord in prayer. Your entries are stored privately on your account.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold shadow-xs hover:bg-amber-600 transition"
            >
              Add First Prayer Request
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPrayers.map(prayer => (
              <div
                key={prayer.id}
                className={`p-4 rounded-3xl border transition shadow-xs ${
                  prayer.status === 'answered'
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{prayer.category || 'General'}</span>
                      </span>

                      {prayer.status === 'answered' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Answered Praise!</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-base leading-snug">{prayer.title}</h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(prayer)}
                      className="p-1.5 text-stone-400 hover:text-amber-500 transition"
                      title="Edit Prayer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePrayer(prayer.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-500 transition"
                      title="Delete Prayer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {prayer.description && (
                  <p className="mt-2 text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                    {prayer.description}
                  </p>
                )}

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-stone-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(prayer.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleIPrayed(prayer.id)}
                      className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-bold flex items-center space-x-1 active:scale-95 transition"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Prayed ({prayer.prayCount || 1})</span>
                    </button>

                    {prayer.status !== 'answered' ? (
                      <button
                        onClick={() => updatePrayerStatus(prayer.id, 'answered')}
                        className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center space-x-1"
                        title="Mark as Answered"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => updatePrayerStatus(prayer.id, 'active')}
                        className="p-1.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-500 text-xs font-bold"
                        title="Reopen Request"
                      >
                        Reopen
                      </button>
                    )}

                    {prayer.status !== 'archived' && (
                      <button
                        onClick={() => updatePrayerStatus(prayer.id, 'archived')}
                        className="p-1.5 text-stone-400 hover:text-stone-300 transition"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Prayer Request Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleSavePrayer}
            className="w-full max-w-md p-5 rounded-3xl bg-stone-900 border border-stone-800 text-stone-100 shadow-2xl space-y-4 animate-slideUp"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="w-5 h-5 text-amber-400" />
                <h2 className="font-serif font-bold text-lg">
                  {editingPrayerId ? 'Edit Prayer Request' : 'New Prayer Request'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-stone-800 text-stone-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Title / Intention *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guidance for career decision..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-800 border border-stone-700 text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Personal">Personal</option>
                  <option value="Family">Family</option>
                  <option value="Health">Health & Healing</option>
                  <option value="Spiritual">Spiritual Growth</option>
                  <option value="Work">Work / Finances</option>
                  <option value="World">World / Church</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">Details & Verses (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Add specific details or scripture references to pray through..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 text-xs focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-2xl border border-stone-700 text-xs font-bold text-stone-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold shadow-md transition"
              >
                {editingPrayerId ? 'Update Request' : 'Save Request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
