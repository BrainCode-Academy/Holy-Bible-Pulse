import { Bible, Book, Chapter, Verse, DailyVerse, DailyDevotional } from '../../src/types';

export interface IBibleProvider {
  id: string;
  name: string;
  isAvailable(): boolean;
  getBibles(language?: string): Promise<Bible[]>;
  getBible(bibleId: string): Promise<Bible | null>;
  getBooks(bibleId: string): Promise<Book[]>;
  getChapter(bibleId: string, chapterId: string): Promise<{ chapter: Chapter; verses: Verse[] } | null>;
  search(bibleId: string, query: string, limit?: number, offset?: number): Promise<{ query: string; bibleId: string; total: number; offset: number; limit: number; verses: Verse[] }>;
  getVerseOfDay(): Promise<DailyVerse>;
  getDevotional(): Promise<DailyDevotional>;
}
