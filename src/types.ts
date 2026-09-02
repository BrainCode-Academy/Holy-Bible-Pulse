export type ReaderThemeMode = 'light' | 'dark' | 'sepia';
export type ReaderFontFamily = 'serif' | 'sans' | 'mono';
export type ReaderLineSpacing = 'comfortable' | 'compact' | 'spacious';

export interface Language {
  id: string; // e.g. 'eng', 'spa', 'fra'
  name: string; // e.g. 'English'
  nameLocal: string; // e.g. 'English'
  script?: string;
}

export interface Bible {
  id: string;
  dblId?: string;
  abbreviation: string;
  name: string;
  description?: string;
  language: Language;
  copyright?: string;
  infoUrl?: string;
  isPublicDomain?: boolean;
  provider: 'api.bible' | 'public_domain' | 'custom';
}

export interface Book {
  id: string; // e.g. 'GEN', 'MAT'
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong?: string;
  chaptersCount: number;
  testament: 'OT' | 'NT';
  order: number;
}

export interface Chapter {
  id: string; // e.g. 'GEN.1'
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
  verseCount: number;
  previousChapterId?: string;
  nextChapterId?: string;
}

export interface Verse {
  id: string; // e.g. 'GEN.1.1'
  chapterId: string;
  bookId: string;
  number: number;
  text: string;
  reference: string;
  formattedText?: string;
}

export interface Bookmark {
  id: string;
  verseId: string;
  reference: string;
  text: string;
  createdAt: string;
  note?: string;
  category?: string;
  bibleId?: string;
}

export interface Highlight {
  id: string;
  verseId: string;
  reference: string;
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
  createdAt: string;
  textSnippet: string;
}

export interface Note {
  id: string;
  verseId?: string;
  reference?: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface ReadingProgress {
  lastReadBibleId: string;
  lastReadBookId: string;
  lastReadChapterId: string;
  lastReadReference: string;
  lastReadTimestamp: string;
  history: Array<{
    bibleId: string;
    bookId: string;
    chapterId: string;
    reference: string;
    timestamp: string;
  }>;
}

export interface ReadingPlanDay {
  day: number;
  title: string;
  references: string[]; // e.g. ["GEN.1", "GEN.2", "PSA.1"]
  completed: boolean;
  completedAt?: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  category: 'General' | 'New Testament' | 'Old Testament' | 'Topical' | 'Beginners' | 'Devotional' | 'Canonical';
  durationDays: number;
  imageUrl?: string;
  currentDay: number;
  isEnrolled: boolean;
  enrolledAt?: string;
  days: ReadingPlanDay[];
}

export interface DailyVerse {
  reference: string;
  text: string;
  translation: string;
  reflection?: string;
  date: string;
  theme?: string;
  bookId: string;
  chapterId: string;
  verseNumber: number;
}

export interface DailyDevotional {
  id: string;
  title: string;
  author: string;
  scripturalReference: string;
  keyVerseText: string;
  content: string;
  prayer: string;
  date: string;
}

export interface ReaderSettings {
  fontSize: number; // in pixels (e.g. 14 to 28)
  fontFamily: ReaderFontFamily;
  themeMode: ReaderThemeMode;
  lineSpacing: ReaderLineSpacing;
  showVerseNumbers: boolean;
  redLetter: boolean; // Jesus words in red where available
  justifyText: boolean;
  autoPlayNextChapter?: boolean;
  selectedVoiceURI?: string | null;
}

export interface ServerStatusResponse {
  status: string;
  apiBibleKeyPresent: boolean;
  activeProvider: string;
  availableBiblesCount: number;
  providers: Array<{
    id: string;
    name: string;
    enabled: boolean;
    description: string;
  }>;
}

export type PrayerStatus = 'active' | 'answered' | 'archived';

export interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: PrayerStatus;
  category?: string;
  prayCount: number;
}

export interface DictionaryTerm {
  id: string;
  term: string;
  definition: string;
  partOfSpeech?: string;
  scriptureReferences?: string[];
  etymology?: string;
}

export interface SongHymn {
  id: string;
  title: string;
  author?: string;
  year?: string;
  lyrics: string;
  category: 'Grace' | 'Praise' | 'Comfort' | 'Worship' | 'Faith' | 'Cross' | 'Devotion' | 'Assurance' | 'Faithfulness' | 'Salvation' | 'Invitation' | 'Christmas' | 'Easter' | 'Prayer' | 'Christian Life' | 'Consecration' | 'Trust' | 'Guidance' | 'Thanksgiving' | 'Love' | 'Doxology' | 'General';
  isPublicDomain: boolean;
}

export type UserRole = 'USER' | 'ADMIN';
export type AuthProvider = 'local' | 'google';
export type ProfileImageType = 'uploaded_photo' | 'avatar' | 'default';

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  profileImageType?: ProfileImageType;
  avatarId?: string | null;
  avatarBgColor?: string | null;
  authProvider: AuthProvider;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  totalSessions: number;
  avgSessionDurationMinutes: number;
  notificationOptInRate: number;
  readingPlanUsers: number;
  eventCounts: Record<string, number>;
  topBooks: Array<{ bookId: string; count: number }>;
  topChapters: Array<{ chapterRef: string; count: number }>;
  topSearchTerms: Array<{ term: string; count: number }>;
  topVersions: Array<{ version: string; count: number }>;
}

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  profileImageType?: ProfileImageType;
  avatarId?: string | null;
  avatarBgColor?: string | null;
  authProvider: AuthProvider;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  isActive: boolean;
}

export interface AdminUserDetail extends AdminUserListItem {
  totalSessions: number;
  featureUsageSummary: Record<string, number>;
  recentEvents: Array<{
    eventType: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
}

export interface UserSyncPayload {
  bookmarks?: Bookmark[];
  highlights?: Highlight[];
  notes?: Note[];
  readingProgress?: ReadingProgress;
  readingPlans?: ReadingPlan[];
  prayerRequests?: PrayerRequest[];
  readerSettings?: ReaderSettings;
  favoriteSongIds?: string[];
  notificationSettings?: {
    dailyVerseEnabled?: boolean;
    dailyVerseTime?: string;
    devotionalEnabled?: boolean;
    devotionalTime?: string;
    readingPlanEnabled?: boolean;
    readingPlanTime?: string;
    prayerReminderEnabled?: boolean;
    prayerReminderTime?: string;
    lastNotifiedVotdDate?: string;
    lastNotifiedDevotionalDate?: string;
    lastNotifiedPlanDate?: string;
    lastNotifiedPrayerDate?: string;
  };
  audioSpeed?: number;
  selectedBibleId?: string;
  votdSelectedBg?: string;
  updatedAt?: string;
}

