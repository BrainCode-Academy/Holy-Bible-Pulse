import React, { useState, useEffect } from 'react';
import { BibleProviderContext, useBible } from './context/BibleContext';
import { scheduleNextVotdNotification } from './services/notificationService';
import { NavigationHeader, BottomNavigation } from './components/Navigation';
import { SplashScreen } from './components/SplashScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { BibleScreen } from './components/screens/BibleScreen';
import { BibleReaderScreen } from './components/screens/BibleReaderScreen';
import { SearchScreen } from './components/screens/SearchScreen';
import { SavedScreen } from './components/screens/SavedScreen';
import { PlansScreen } from './components/screens/PlansScreen';
import { MeScreen } from './components/screens/MeScreen';
import { AdminDashboardScreen } from './components/screens/AdminDashboardScreen';
import { PrayerScreen } from './components/screens/PrayerScreen';
import { DictionaryScreen } from './components/screens/DictionaryScreen';
import { HymnsScreen } from './components/screens/HymnsScreen';
import { DevotionalScreen } from './components/screens/DevotionalScreen';

import { VerseContextMenuModal } from './components/modals/VerseContextMenuModal';
import { NoteModal } from './components/modals/NoteModal';
import { ShareVerseModal } from './components/modals/ShareVerseModal';
import { PrayerModal } from './components/modals/PrayerModal';
import { AuthModal } from './components/modals/AuthModal';

import { Verse, Note } from './types';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab, readerSettings } = useBible();

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return !localStorage.getItem('hb_splash_seen');
  });

  const [selectedVerseForContext, setSelectedVerseForContext] = useState<Verse | null>(null);

  const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteInitialRef, setNoteInitialRef] = useState<string>('');
  const [noteInitialVerseId, setNoteInitialVerseId] = useState<string>('');

  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [shareVerseText, setShareVerseText] = useState<string>('');
  const [shareReference, setShareReference] = useState<string>('');

  const [prayerModalOpen, setPrayerModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Schedule all active notification categories (VOTD, Devotional, Plan, Prayer)
    scheduleNextVotdNotification();

    // Check URL query param for deep linking e.g. /?tab=devotional
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as any;
      if (tabParam && ['home', 'bible', 'reader', 'search', 'saved', 'plans', 'settings', 'prayer', 'dictionary', 'hymns', 'devotional', 'admin'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }

    // 1. In-app custom event listener for notification click
    const handleOpenTab = (e: any) => {
      const targetTab = e.detail?.tab || 'home';
      setActiveTab(targetTab);
    };

    const handleOpenHome = () => {
      setActiveTab('home');
    };

    // 2. Service worker postMessage listener
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'HB_NOTIFICATION_CLICK') {
        const targetTab = event.data?.tab || 'home';
        setActiveTab(targetTab);
      }
    };

    window.addEventListener('hb_open_tab', handleOpenTab);
    window.addEventListener('hb_open_home', handleOpenHome);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      window.removeEventListener('hb_open_tab', handleOpenTab);
      window.removeEventListener('hb_open_home', handleOpenHome);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [setActiveTab]);

  const handleStartFromSplash = () => {
    localStorage.setItem('hb_splash_seen', 'true');
    setShowSplash(false);
  };

  const handleOpenNoteModal = (note?: Note | null, ref?: string, verseId?: string) => {
    setEditingNote(note || null);
    setNoteInitialRef(ref || '');
    setNoteInitialVerseId(verseId || '');
    setNoteModalOpen(true);
  };

  const handleOpenShareModal = (text: string, ref: string) => {
    setShareVerseText(text);
    setShareReference(ref);
    setShareModalOpen(true);
  };

  const isDark = readerSettings.themeMode === 'dark';
  const isSepia = readerSettings.themeMode === 'sepia';

  const bodyBgClass = isDark
    ? 'bg-stone-950 text-stone-100 min-h-screen'
    : isSepia
    ? 'bg-[#fbf7ee] text-[#3d2e1e] min-h-screen'
    : 'bg-gradient-to-b from-amber-50/40 via-stone-50 to-amber-50/30 text-stone-900 min-h-screen';

  if (showSplash) {
    return <SplashScreen onStart={handleStartFromSplash} />;
  }

  return (
    <div className={`flex flex-col min-h-screen ${bodyBgClass} selection:bg-amber-500 selection:text-white transition-colors duration-200`}>
      {/* Top Header */}
      <NavigationHeader
        onOpenSearch={() => setActiveTab('search')}
        onOpenPrayer={() => setPrayerModalOpen(true)}
      />

      {/* Main View Screen Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4 pb-24">
        {activeTab === 'home' && (
          <HomeScreen
            onOpenPrayer={() => setPrayerModalOpen(true)}
            onOpenShareVerse={(text, ref) => handleOpenShareModal(text, ref)}
          />
        )}

        {activeTab === 'bible' && <BibleScreen />}

        {activeTab === 'reader' && (
          <BibleReaderScreen
            onOpenContextMenu={verse => setSelectedVerseForContext(verse)}
          />
        )}

        {activeTab === 'search' && <SearchScreen />}

        {activeTab === 'saved' && (
          <SavedScreen
            onOpenNoteModal={note => handleOpenNoteModal(note)}
          />
        )}

        {activeTab === 'plans' && <PlansScreen />}

        {activeTab === 'settings' && <MeScreen />}

        {activeTab === 'admin' && <AdminDashboardScreen />}

        {activeTab === 'prayer' && <PrayerScreen />}

        {activeTab === 'dictionary' && <DictionaryScreen />}

        {activeTab === 'hymns' && <HymnsScreen />}

        {activeTab === 'devotional' && <DevotionalScreen />}
      </main>

      {/* Bottom Sticky Tab Bar */}
      <BottomNavigation />

      {/* Global Action Modals */}
      <AuthModal />

      <VerseContextMenuModal
        verse={selectedVerseForContext}
        onClose={() => setSelectedVerseForContext(null)}
        onOpenNote={(ref, verseId) => handleOpenNoteModal(null, ref, verseId)}
        onOpenShare={(text, ref) => handleOpenShareModal(text, ref)}
      />

      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        editingNote={editingNote}
        initialReference={noteInitialRef}
        initialVerseId={noteInitialVerseId}
      />

      <ShareVerseModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        verseText={shareVerseText}
        reference={shareReference}
      />

      <PrayerModal
        isOpen={prayerModalOpen}
        onClose={() => setPrayerModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BibleProviderContext>
      <MainAppContent />
    </BibleProviderContext>
  );
}
