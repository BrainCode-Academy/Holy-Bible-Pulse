import React, { useState, useEffect } from 'react';
import { useBible } from '../../context/BibleContext';
import { Note } from '../../types';
import { X, Save, FileText, Tag } from 'lucide-react';

export const NoteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  editingNote?: Note | null;
  initialReference?: string;
  initialVerseId?: string;
}> = ({ isOpen, onClose, editingNote, initialReference, initialVerseId }) => {
  if (!isOpen) return null;

  const { saveNote, readerSettings } = useBible();

  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('Personal, Prayer');

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const modalBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#e2d7be] text-[#302110]'
    : 'bg-white border-amber-100 text-stone-900';

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setReference(editingNote.reference || '');
      setTagInput(editingNote.tags ? editingNote.tags.join(', ') : 'Personal');
    } else {
      setTitle(initialReference ? `Reflection on ${initialReference}` : 'My Scripture Note');
      setContent('');
      setReference(initialReference || '');
      setTagInput('Personal, Study');
    }
  }, [editingNote, initialReference]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tagsArray = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    saveNote({
      id: editingNote?.id,
      verseId: editingNote?.verseId || initialVerseId,
      reference: reference.trim() || undefined,
      title: title.trim(),
      content: content.trim(),
      tags: tagsArray,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-md p-5 rounded-3xl border shadow-2xl space-y-4 ${modalBg} animate-slideUp`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <h2 className="font-serif font-bold text-lg">
              {editingNote ? 'Edit Study Note' : 'New Study Note'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-500/10 text-stone-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">
              Note Title:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Antidote to Anxiety..."
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">
              Scripture Reference (Optional):
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. Philippians 4:6-7"
              className="w-full px-3.5 py-2 rounded-xl border text-xs outline-none bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">
              Reflection & Study Notes:
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your study notes, personal prayer points, or insights here..."
              className="w-full p-3.5 rounded-xl border text-xs leading-relaxed outline-none bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 focus:border-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">
              Tags (comma separated):
            </label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="e.g. Faith, Peace, Study"
                className="w-full pl-8 pr-3.5 py-2 rounded-xl border text-xs outline-none bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-600/20 flex items-center space-x-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
