import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Bible,
  Bookmark,
  Highlight,
  Note,
  ReadingProgress,
  ReadingPlan,
  ReaderSettings,
  ServerStatusResponse,
  PrayerRequest,
  PrayerStatus,
  User,
  UserSyncPayload,
} from '../types';
import { getServerStatus, getBibles } from '../services/api';
import {
  getCurrentUser,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  updateProfile,
  uploadAvatarImage,
  chooseAvatar,
  removeAvatarImage,
  fetchUserSyncData,
  saveUserSyncData,
} from '../services/authApi';
import {
  AppNotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  subscribeToNotificationSettings,
} from '../services/notificationService';
import { trackEvent } from '../services/analyticsClient';
import { INITIAL_READING_PLANS } from '../data/plansData';

export type ScreenTab =
  | 'home'
  | 'bible'
  | 'reader'
  | 'search'
  | 'saved'
  | 'plans'
  | 'settings'
  | 'prayer'
  | 'dictionary'
  | 'hymns'
  | 'devotional'
  | 'admin';

export interface BibleContextType {
  activeTab: ScreenTab;
  setActiveTab: (tab: ScreenTab) => void;
  selectedBibleId: string;
  setSelectedBibleId: (id: string) => void;
  bibles: Bible[];
  currentBookId: string;
  setCurrentBookId: (bookId: string) => void;
  currentChapterId: string;
  setCurrentChapterId: (chapterId: string) => void;
  currentReference: string;
  setCurrentReference: (ref: string) => void;
  readerSettings: ReaderSettings;
  updateSettings: (newSettings: Partial<ReaderSettings>) => void;
  bookmarks: Bookmark[];
  toggleBookmark: (verseId: string, reference: string, text: string, bibleId?: string) => void;
  isBookmarked: (verseId: string) => boolean;
  highlights: Highlight[];
  addHighlight: (verseId: string, reference: string, color: Highlight['color'], textSnippet: string) => void;
  removeHighlight: (verseId: string) => void;
  getHighlightColor: (verseId: string) => Highlight['color'] | null;
  notes: Note[];
  saveNote: (note: Partial<Note> & { title: string; content: string }) => void;
  deleteNote: (id: string) => void;
  prayers: PrayerRequest[];
  addPrayer: (title: string, description: string, category?: string) => void;
  updatePrayerStatus: (id: string, status: PrayerStatus) => void;
  deletePrayer: (id: string) => void;
  incrementPrayerCount: (id: string) => void;
  favoriteSongIds: string[];
  toggleFavoriteSong: (id: string) => void;
  isFavoriteSong: (id: string) => boolean;
  audioSpeed: number;
  setAudioSpeed: (speed: number) => void;
  readingProgress: ReadingProgress;
  updateReadingProgress: (bibleId: string, bookId: string, chapterId: string, ref: string) => void;
  plans: ReadingPlan[];
  togglePlanEnrollment: (planId: string) => void;
  togglePlanDayCompletion: (planId: string, day: number) => void;
  resetAllData: () => void;
  serverStatus: ServerStatusResponse | null;
  openReader: (bibleId: string, bookId: string, chapterId: string, ref?: string, targetVerseId?: string) => void;
  targetVerseId: string | null;
  setTargetVerseId: (id: string | null) => void;
  isLoadingBibles: boolean;
  reloadServerStatus: () => Promise<void>;
  
  // Auth state & actions
  user: User | null;
  isLoadingUser: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot';
  openAuthModal: (mode?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (fullName: string, email: string, pass: string, confirmPass: string) => Promise<void>;
  loginGoogle: (credential: string, clientId?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (fullName?: string, avatarUrl?: string | null) => Promise<void>;
  uploadAvatar: (imageBase64: string, mimeType: string) => Promise<User>;
  chooseAvatarOption: (avatarId: string, avatarBgColor?: string | null) => Promise<User>;
  removeAvatar: () => Promise<User>;
  isSyncing: boolean;
  isHydrated: boolean;
  syncUserCloudData: () => Promise<void>;

  // Additional Persisted Customizations
  votdSelectedBg: string;
  setVotdSelectedBg: (bgId: string) => void;
  notificationSettings: AppNotificationSettings;
  updateNotificationSettings: (newSettings: Partial<AppNotificationSettings>) => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  fontFamily: 'serif',
  themeMode: 'light',
  lineSpacing: 'comfortable',
  showVerseNumbers: true,
  redLetter: true,
  justifyText: false,
  autoPlayNextChapter: false,
  selectedVoiceURI: null,
};

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export const BibleProviderContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<ScreenTab>('home');
  const [selectedBibleId, setSelectedBibleId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('hb_selected_bible_id');
      return saved || 'web';
    } catch {
      return 'web';
    }
  });
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [isLoadingBibles, setIsLoadingBibles] = useState<boolean>(true);
  const [serverStatus, setServerStatus] = useState<ServerStatusResponse | null>(null);

  const [currentBookId, setCurrentBookId] = useState<string>('GEN');
  const [currentChapterId, setCurrentChapterId] = useState<string>('GEN.1');
  const [currentReference, setCurrentReference] = useState<string>('Genesis 1');
  const [targetVerseId, setTargetVerseId] = useState<string | null>(null);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const isCloudHydratedRef = useRef<boolean>(false);

  // Reader Settings State (persisted in localStorage as cache)
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => {
    try {
      const saved = localStorage.getItem('hb_reader_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('hb_bookmarks');
      return saved ? JSON.parse(saved) : [
        {
          id: 'bm-1',
          verseId: 'PHIL.4.6',
          reference: 'Philippians 4:6',
          text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',
          createdAt: new Date().toISOString(),
          category: 'Peace',
        },
        {
          id: 'bm-2',
          verseId: 'PSA.23.1',
          reference: 'Psalm 23:1',
          text: 'The LORD is my shepherd; I shall not want.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          category: 'Comfort',
        }
      ];
    } catch {
      return [];
    }
  });

  // Highlights
  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    try {
      const saved = localStorage.getItem('hb_highlights');
      return saved ? JSON.parse(saved) : [
        {
          id: 'hl-1',
          verseId: 'GEN.1.3',
          reference: 'Genesis 1:3',
          color: 'yellow',
          createdAt: new Date().toISOString(),
          textSnippet: 'God said, "Let there be light," and there was light.',
        },
        {
          id: 'hl-2',
          verseId: 'JOHN.1.1',
          reference: 'John 1:1',
          color: 'blue',
          createdAt: new Date().toISOString(),
          textSnippet: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
        }
      ];
    } catch {
      return [];
    }
  });

  // Notes
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('hb_notes');
      return saved ? JSON.parse(saved) : [
        {
          id: 'note-1',
          verseId: 'PHIL.4.6',
          reference: 'Philippians 4:6-7',
          title: 'Antidote to Anxiety',
          content: 'Notice the transition: anxiety -> prayer with thanksgiving -> peace. Thanksgiving transforms our perspective before circumstances even change.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['Peace', 'Prayer', 'Faith'],
        }
      ];
    } catch {
      return [];
    }
  });

  // Reading Progress
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>(() => {
    try {
      const saved = localStorage.getItem('hb_progress');
      return saved ? JSON.parse(saved) : {
        lastReadBibleId: '',
        lastReadBookId: '',
        lastReadChapterId: '',
        lastReadReference: '',
        lastReadTimestamp: '',
        history: [],
      };
    } catch {
      return {
        lastReadBibleId: '',
        lastReadBookId: '',
        lastReadChapterId: '',
        lastReadReference: '',
        lastReadTimestamp: '',
        history: [],
      };
    }
  });

  // Reading Plans
  const [plans, setPlans] = useState<ReadingPlan[]>(() => {
    try {
      const saved = localStorage.getItem('hb_plans');
      return saved ? JSON.parse(saved) : INITIAL_READING_PLANS;
    } catch {
      return INITIAL_READING_PLANS;
    }
  });

  // Prayer Requests
  const [prayers, setPrayers] = useState<PrayerRequest[]>(() => {
    try {
      const saved = localStorage.getItem('hb_prayers');
      return saved ? JSON.parse(saved) : [
        {
          id: 'prayer-1',
          title: 'Peace and Protection for My Family',
          description: 'Praying for God’s guidance, health, and spiritual growth for all family members.',
          status: 'active',
          category: 'Family',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          prayCount: 3,
        },
        {
          id: 'prayer-2',
          title: 'Healing for Community Members',
          description: 'Interceding for physical restoration and comfort.',
          status: 'answered',
          category: 'Health',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date().toISOString(),
          prayCount: 7,
        }
      ];
    } catch {
      return [];
    }
  });

  // Favorite Hymns/Songs
  const [favoriteSongIds, setFavoriteSongIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hb_favorite_songs');
      return saved ? JSON.parse(saved) : ['hymn-1', 'hymn-3'];
    } catch {
      return [];
    }
  });

  // Audio Playback Speed
  const [audioSpeed, setAudioSpeedState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hb_audio_speed');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  // VOTD Background Customization
  const [votdSelectedBg, setVotdSelectedBgState] = useState<string>(() => {
    try {
      return localStorage.getItem('hb_votd_selected_bg') || '';
    } catch {
      return '';
    }
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettingsState] = useState<AppNotificationSettings>(() => {
    return getNotificationSettings();
  });

  // Listen for external notification settings updates
  useEffect(() => {
    const unsubscribe = subscribeToNotificationSettings((updated) => {
      setNotificationSettingsState(updated);
    });
    return unsubscribe;
  }, []);

  const setAudioSpeed = useCallback((speed: number) => {
    setAudioSpeedState(speed);
    try {
      localStorage.setItem('hb_audio_speed', speed.toString());
    } catch {}
  }, []);

  const setVotdSelectedBg = useCallback((bgId: string) => {
    setVotdSelectedBgState(bgId);
    try {
      if (bgId) {
        localStorage.setItem('hb_votd_selected_bg', bgId);
      } else {
        localStorage.removeItem('hb_votd_selected_bg');
      }
    } catch {}
  }, []);

  const updateNotificationSettings = useCallback((newSettings: Partial<AppNotificationSettings>) => {
    const updated = { ...notificationSettings, ...newSettings };
    setNotificationSettingsState(updated);
    saveNotificationSettings(updated);
  }, [notificationSettings]);

  // Track tab switching analytics
  const setActiveTab = useCallback((tab: ScreenTab) => {
    setActiveTabState(tab);
    if (tab === 'bible') trackEvent('bible_opened');
    if (tab === 'devotional') trackEvent('devotional_opened');
    if (tab === 'hymns') trackEvent('hymn_opened');
  }, []);

  // Fetch Server Status and Available Bibles on load
  const reloadServerStatus = async () => {
    try {
      const status = await getServerStatus();
      setServerStatus(status);
      const biblesList = await getBibles();
      setBibles(biblesList);

      if (biblesList && biblesList.length > 0) {
        setSelectedBibleId(current => {
          const exists = biblesList.find(b => b.id.toLowerCase() === current.toLowerCase());
          if (exists && current !== 'web' && current !== 'kjv') {
            return exists.id;
          }
          const kjvMatch = biblesList.find(b =>
            b.abbreviation.toLowerCase().includes('kjv') ||
            b.name.toLowerCase().includes('king james')
          );
          if (kjvMatch) {
            return kjvMatch.id;
          }
          return biblesList[0].id;
        });
      }
    } catch (err) {
      console.warn('Failed to connect to backend server status', err);
    } finally {
      setIsLoadingBibles(false);
    }
  };

  /**
   * Sync user's cloud data with local store.
   * STRICT ORDER OF OPERATIONS:
   * 1. Authenticate user.
   * 2. Fetch Firestore userSyncData.
   * 3. Hydrate React state from Firestore (Cloud data wins during hydration).
   * 4. Mark cloud hydration as complete.
   * 5. Only subsequent user mutations sync back to Firestore.
   */
  const syncUserCloudData = useCallback(async () => {
    try {
      setIsSyncing(true);
      isCloudHydratedRef.current = false;
      setIsHydrated(false);

      const cloudData = await fetchUserSyncData();
      if (cloudData) {
        // Hydrate Bookmarks
        if (Array.isArray(cloudData.bookmarks) && cloudData.bookmarks.length > 0) {
          setBookmarks(cloudData.bookmarks);
        }

        // Hydrate Highlights
        if (Array.isArray(cloudData.highlights) && cloudData.highlights.length > 0) {
          setHighlights(cloudData.highlights);
        }

        // Hydrate Notes
        if (Array.isArray(cloudData.notes) && cloudData.notes.length > 0) {
          setNotes(cloudData.notes);
        }

        // Hydrate Prayers
        if (Array.isArray(cloudData.prayerRequests) && cloudData.prayerRequests.length > 0) {
          setPrayers(cloudData.prayerRequests);
        }

        // Hydrate Reading Plans
        if (Array.isArray(cloudData.readingPlans) && cloudData.readingPlans.length > 0) {
          setPlans(cloudData.readingPlans);
        }

        // Hydrate Favorite Songs
        if (Array.isArray(cloudData.favoriteSongIds) && cloudData.favoriteSongIds.length > 0) {
          setFavoriteSongIds(cloudData.favoriteSongIds);
        }

        // Hydrate Reading Progress
        if (cloudData.readingProgress && cloudData.readingProgress.lastReadBookId) {
          setReadingProgress(cloudData.readingProgress);
        }

        // Hydrate Reader Settings
        if (cloudData.readerSettings && typeof cloudData.readerSettings === 'object') {
          setReaderSettings(prev => ({ ...prev, ...cloudData.readerSettings }));
        }

        // Hydrate Audio Speed
        if (typeof cloudData.audioSpeed === 'number' && !isNaN(cloudData.audioSpeed)) {
          setAudioSpeedState(cloudData.audioSpeed);
          localStorage.setItem('hb_audio_speed', cloudData.audioSpeed.toString());
        }

        // Hydrate Selected Bible ID
        if (typeof cloudData.selectedBibleId === 'string' && cloudData.selectedBibleId.trim()) {
          setSelectedBibleId(cloudData.selectedBibleId.trim());
          localStorage.setItem('hb_selected_bible_id', cloudData.selectedBibleId.trim());
        }

        // Hydrate VOTD Background Preference
        if (typeof cloudData.votdSelectedBg === 'string') {
          setVotdSelectedBgState(cloudData.votdSelectedBg);
          if (cloudData.votdSelectedBg) {
            localStorage.setItem('hb_votd_selected_bg', cloudData.votdSelectedBg);
          } else {
            localStorage.removeItem('hb_votd_selected_bg');
          }
        }

        // Hydrate Notification Settings
        if (cloudData.notificationSettings && typeof cloudData.notificationSettings === 'object') {
          const merged: AppNotificationSettings = {
            ...getNotificationSettings(),
            ...cloudData.notificationSettings,
          };
          saveNotificationSettings(merged);
          setNotificationSettingsState(merged);
        }
      }
    } catch (err) {
      console.warn('Error during cloud hydration:', err);
    } finally {
      isCloudHydratedRef.current = true;
      setIsHydrated(true);
      setIsSyncing(false);
    }
  }, []);

  // Load authenticated user on app boot
  useEffect(() => {
    async function loadAuth() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          await syncUserCloudData();
        } else {
          isCloudHydratedRef.current = true;
          setIsHydrated(true);
        }
      } catch (err) {
        console.warn('Failed to load user session:', err);
        isCloudHydratedRef.current = true;
        setIsHydrated(true);
      } finally {
        setIsLoadingUser(false);
      }
    }
    loadAuth();
    reloadServerStatus();
  }, [syncUserCloudData]);

  // Sync mutations back to Firestore ONLY AFTER hydration has completely finished
  useEffect(() => {
    if (user && isCloudHydratedRef.current) {
      const timer = setTimeout(() => {
        saveUserSyncData({
          bookmarks,
          highlights,
          notes,
          readingProgress,
          readingPlans: plans,
          prayerRequests: prayers,
          readerSettings,
          favoriteSongIds,
          notificationSettings,
          audioSpeed,
          selectedBibleId,
          votdSelectedBg,
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    user,
    bookmarks,
    highlights,
    notes,
    readingProgress,
    plans,
    prayers,
    readerSettings,
    favoriteSongIds,
    notificationSettings,
    audioSpeed,
    selectedBibleId,
    votdSelectedBg,
  ]);

  // Local storage cache persistence for instant offline boot
  useEffect(() => {
    try {
      localStorage.setItem('hb_selected_bible_id', selectedBibleId);
    } catch {}
  }, [selectedBibleId]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_reader_settings', JSON.stringify(readerSettings));
    } catch {}
  }, [readerSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_bookmarks', JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_highlights', JSON.stringify(highlights));
    } catch {}
  }, [highlights]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_notes', JSON.stringify(notes));
    } catch {}
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_progress', JSON.stringify(readingProgress));
    } catch {}
  }, [readingProgress]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_plans', JSON.stringify(plans));
    } catch {}
  }, [plans]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_prayers', JSON.stringify(prayers));
    } catch {}
  }, [prayers]);

  useEffect(() => {
    try {
      localStorage.setItem('hb_favorite_songs', JSON.stringify(favoriteSongIds));
    } catch {}
  }, [favoriteSongIds]);

  // Auth Action Handlers
  const openAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const login = async (email: string, pass: string) => {
    const res = await loginWithEmail({ email, password: pass });
    setUser(res.user);
    setAuthModalOpen(false);
    await syncUserCloudData();
  };

  const register = async (fullName: string, email: string, pass: string, confirmPass: string) => {
    const res = await registerWithEmail({ fullName, email, password: pass, confirmPassword: confirmPass });
    setUser(res.user);
    setAuthModalOpen(false);
    await syncUserCloudData();
  };

  const loginGoogle = async (credential: string, clientId?: string) => {
    const res = await loginWithGoogle(credential, clientId);
    setUser(res.user);
    setAuthModalOpen(false);
    await syncUserCloudData();
  };

  const logout = async () => {
    isCloudHydratedRef.current = false;
    setIsHydrated(false);
    await logoutUser();
    setUser(null);
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
  };

  const updateUserProfile = async (fullName?: string, avatarUrl?: string | null) => {
    const updated = await updateProfile({ fullName, avatarUrl });
    setUser(updated);
  };

  const uploadAvatar = async (imageBase64: string, mimeType: string): Promise<User> => {
    const res = await uploadAvatarImage(imageBase64, mimeType);
    setUser(res.user);
    return res.user;
  };

  const chooseAvatarOption = async (avatarId: string, avatarBgColor?: string | null): Promise<User> => {
    const res = await chooseAvatar(avatarId, avatarBgColor);
    setUser(res.user);
    return res.user;
  };

  const removeAvatar = async (): Promise<User> => {
    const res = await removeAvatarImage();
    setUser(res.user);
    return res.user;
  };

  // Handlers
  const addPrayer = (title: string, description: string, category: string = 'Personal') => {
    setPrayers(prev => [
      {
        id: `prayer-${Date.now()}`,
        title,
        description,
        status: 'active',
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        prayCount: 1,
      },
      ...prev,
    ]);
    trackEvent('prayer_created', { category });
  };

  const updatePrayerStatus = (id: string, status: PrayerStatus) => {
    setPrayers(prev =>
      prev.map(p => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p))
    );
  };

  const deletePrayer = (id: string) => {
    setPrayers(prev => prev.filter(p => p.id !== id));
  };

  const incrementPrayerCount = (id: string) => {
    setPrayers(prev =>
      prev.map(p => (p.id === id ? { ...p, prayCount: p.prayCount + 1, updatedAt: new Date().toISOString() } : p))
    );
  };

  const toggleFavoriteSong = (id: string) => {
    setFavoriteSongIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const isFavoriteSong = (id: string) => favoriteSongIds.includes(id);

  const resetAllData = () => {
    localStorage.removeItem('hb_bookmarks');
    localStorage.removeItem('hb_highlights');
    localStorage.removeItem('hb_notes');
    localStorage.removeItem('hb_progress');
    localStorage.removeItem('hb_plans');
    localStorage.removeItem('hb_prayers');
    localStorage.removeItem('hb_favorite_songs');
    localStorage.removeItem('hb_search_history');
    setBookmarks([]);
    setHighlights([]);
    setNotes([]);
    setPrayers([]);
    setFavoriteSongIds([]);
    setReadingProgress({
      lastReadBibleId: '',
      lastReadBookId: '',
      lastReadChapterId: '',
      lastReadReference: '',
      lastReadTimestamp: '',
      history: [],
    });
    setPlans(INITIAL_READING_PLANS);
  };

  const updateSettings = (newSettings: Partial<ReaderSettings>) => {
    setReaderSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleBookmark = (verseId: string, reference: string, text: string, bibleId?: string) => {
    const activeVer = bibleId || selectedBibleId;
    setBookmarks(prev => {
      const exists = prev.find(b => b.verseId === verseId);
      if (exists) {
        return prev.filter(b => b.verseId !== verseId);
      }
      trackEvent('verse_bookmarked', { verseId, reference, bibleId: activeVer });
      return [
        {
          id: `bm-${Date.now()}`,
          verseId,
          reference,
          text,
          bibleId: activeVer,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  };

  const isBookmarked = (verseId: string) => bookmarks.some(b => b.verseId === verseId);

  const addHighlight = (
    verseId: string,
    reference: string,
    color: Highlight['color'],
    textSnippet: string
  ) => {
    setHighlights(prev => {
      const filtered = prev.filter(h => h.verseId !== verseId);
      trackEvent('verse_highlighted', { verseId, reference, color });
      return [
        {
          id: `hl-${Date.now()}`,
          verseId,
          reference,
          color,
          createdAt: new Date().toISOString(),
          textSnippet,
        },
        ...filtered,
      ];
    });
  };

  const removeHighlight = (verseId: string) => {
    setHighlights(prev => prev.filter(h => h.verseId !== verseId));
  };

  const getHighlightColor = (verseId: string) => {
    const found = highlights.find(h => h.verseId === verseId);
    return found ? found.color : null;
  };

  const saveNote = (noteData: Partial<Note> & { title: string; content: string }) => {
    setNotes(prev => {
      if (noteData.id) {
        return prev.map(n =>
          n.id === noteData.id
            ? { ...n, ...noteData, updatedAt: new Date().toISOString() }
            : n
        );
      }
      trackEvent('note_created', { reference: noteData.reference || '' });
      return [
        {
          id: `note-${Date.now()}`,
          verseId: noteData.verseId,
          reference: noteData.reference,
          title: noteData.title,
          content: noteData.content,
          tags: noteData.tags || ['Personal'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const updateReadingProgress = (
    bibleId: string,
    bookId: string,
    chapterId: string,
    ref: string
  ) => {
    setReadingProgress(prev => {
      const filteredHistory = prev.history.filter(h => h.chapterId !== chapterId);
      return {
        lastReadBibleId: bibleId,
        lastReadBookId: bookId,
        lastReadChapterId: chapterId,
        lastReadReference: ref,
        lastReadTimestamp: new Date().toISOString(),
        history: [
          {
            bibleId,
            bookId,
            chapterId,
            reference: ref,
            timestamp: new Date().toISOString(),
          },
          ...filteredHistory.slice(0, 19),
        ],
      };
    });
  };

  const openReader = (
    bibleId: string,
    bookId: string,
    chapterId: string,
    ref?: string,
    targetVerseIdParam?: string
  ) => {
    setSelectedBibleId(bibleId);
    setCurrentBookId(bookId);
    setCurrentChapterId(chapterId);
    const resolvedRef = ref || `${bookId} ${chapterId.split('.')[1] || ''}`;
    if (ref) setCurrentReference(ref);
    if (targetVerseIdParam) {
      setTargetVerseId(targetVerseIdParam);
    } else {
      setTargetVerseId(null);
    }
    updateReadingProgress(bibleId, bookId, chapterId, resolvedRef);
    trackEvent('chapter_opened', {
      bookId,
      chapterRef: resolvedRef,
      bibleVersion: bibleId,
    });
    setActiveTabState('reader');
  };

  const togglePlanEnrollment = (planId: string) => {
    setPlans(prev =>
      prev.map(p => {
        if (p.id !== planId) return p;
        const willEnroll = !p.isEnrolled;
        if (willEnroll) {
          trackEvent('reading_plan_started', { planId });
        }
        return {
          ...p,
          isEnrolled: willEnroll,
          enrolledAt: willEnroll ? new Date().toISOString() : undefined,
        };
      })
    );
  };

  const togglePlanDayCompletion = (planId: string, day: number) => {
    setPlans(prev =>
      prev.map(p => {
        if (p.id !== planId) return p;
        const updatedDays = p.days.map(d => {
          if (d.day === day) {
            const nextCompleted = !d.completed;
            return {
              ...d,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : undefined,
            };
          }
          return d;
        });
        const completedCount = updatedDays.filter(d => d.completed).length;
        if (completedCount === p.durationDays) {
          trackEvent('reading_plan_completed', { planId });
        }
        return {
          ...p,
          days: updatedDays,
          currentDay: Math.min(completedCount + 1, p.durationDays),
        };
      })
    );
  };

  return (
    <BibleContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedBibleId,
        setSelectedBibleId,
        bibles,
        currentBookId,
        setCurrentBookId,
        currentChapterId,
        setCurrentChapterId,
        currentReference,
        setCurrentReference,
        readerSettings,
        updateSettings,
        bookmarks,
        toggleBookmark,
        isBookmarked,
        highlights,
        addHighlight,
        removeHighlight,
        getHighlightColor,
        notes,
        saveNote,
        deleteNote,
        prayers,
        addPrayer,
        updatePrayerStatus,
        deletePrayer,
        incrementPrayerCount,
        favoriteSongIds,
        toggleFavoriteSong,
        isFavoriteSong,
        audioSpeed,
        setAudioSpeed,
        readingProgress,
        updateReadingProgress,
        plans,
        togglePlanEnrollment,
        togglePlanDayCompletion,
        resetAllData,
        serverStatus,
        openReader,
        targetVerseId,
        setTargetVerseId,
        isLoadingBibles,
        reloadServerStatus,
        user,
        isLoadingUser,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginGoogle,
        logout,
        updateUserProfile,
        uploadAvatar,
        chooseAvatarOption,
        removeAvatar,
        isSyncing,
        isHydrated,
        syncUserCloudData,
        votdSelectedBg,
        setVotdSelectedBg,
        notificationSettings,
        updateNotificationSettings,
      }}
    >
      {children}
    </BibleContext.Provider>
  );
};

export const useBible = () => {
  const context = useContext(BibleContext);
  if (!context) {
    throw new Error('useBible must be used within a BibleProviderContext');
  }
  return context;
};
