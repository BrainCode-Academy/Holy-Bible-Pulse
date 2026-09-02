import { IBibleProvider } from './types';
import { Bible, Book, Chapter, Verse, DailyVerse, DailyDevotional } from '../../src/types';
import {
  PUBLIC_BIBLES,
  BIBLE_BOOKS,
  KNOWN_CHAPTER_VERSES,
  DAILY_VERSES,
  DAILY_DEVOTIONAL,
  getDeterministicDailyVerse,
} from './publicDomainData';

export class PublicDomainBibleProvider implements IBibleProvider {
  id = 'public_domain';
  name = 'Public Domain Bible Provider';

  isAvailable(): boolean {
    return true; // Always available without key
  }

  async getBibles(language?: string): Promise<Bible[]> {
    if (!language) return PUBLIC_BIBLES;
    const langLower = language.toLowerCase();
    return PUBLIC_BIBLES.filter(
      b => b.language.id.toLowerCase() === langLower || b.language.name.toLowerCase().includes(langLower)
    );
  }

  async getBible(bibleId: string): Promise<Bible | null> {
    const found = PUBLIC_BIBLES.find(b => b.id.toLowerCase() === bibleId.toLowerCase());
    return found || PUBLIC_BIBLES[0];
  }

  async getBooks(bibleId: string): Promise<Book[]> {
    return BIBLE_BOOKS.map(b => ({
      id: b.id,
      bibleId,
      abbreviation: b.abbr,
      name: b.name,
      nameLong: b.nameLong,
      chaptersCount: b.chaptersCount,
      testament: b.testament,
      order: b.order,
    }));
  }

  async getChapter(bibleId: string, chapterId: string): Promise<{ chapter: Chapter; verses: Verse[] } | null> {
    // chapterId format: 'GEN.1' or 'PSA.23' or 'GEN-1'
    const parts = chapterId.replace('-', '.').split('.');
    const bookId = parts[0]?.toUpperCase() || 'GEN';
    const numStr = parts[1] || '1';
    const num = parseInt(numStr, 10) || 1;

    const bookDef = BIBLE_BOOKS.find(b => b.id === bookId) || BIBLE_BOOKS[0];
    const key = `${bookId}.${num}`;

    // Get verses from known dictionary
    const rawVerses = KNOWN_CHAPTER_VERSES[key];
    if (!rawVerses || rawVerses.length === 0) {
      return null;
    }

    // Calculate previous/next chapter IDs
    let prevChapterId: string | undefined;
    let nextChapterId: string | undefined;

    if (num > 1) {
      prevChapterId = `${bookId}.${num - 1}`;
    } else {
      // Previous book's last chapter
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === bookId);
      if (bookIndex > 0) {
        const prevBook = BIBLE_BOOKS[bookIndex - 1];
        prevChapterId = `${prevBook.id}.${prevBook.chaptersCount}`;
      }
    }

    if (num < bookDef.chaptersCount) {
      nextChapterId = `${bookId}.${num + 1}`;
    } else {
      // Next book's first chapter
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === bookId);
      if (bookIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[bookIndex + 1];
        nextChapterId = `${nextBook.id}.1`;
      }
    }

    const chapter: Chapter = {
      id: key,
      bibleId,
      bookId,
      number: num.toString(),
      reference: `${bookDef.name} ${num}`,
      verseCount: rawVerses.length,
      previousChapterId: prevChapterId,
      nextChapterId: nextChapterId,
    };

    const verses: Verse[] = rawVerses.map(v => ({
      id: `${key}.${v.number}`,
      chapterId: key,
      bookId,
      number: v.number,
      text: v.text,
      reference: `${bookDef.name} ${num}:${v.number}`,
    }));

    return { chapter, verses };
  }

  async search(
    bibleId: string,
    query: string,
    limit = 25,
    offset = 0
  ): Promise<{ query: string; bibleId: string; total: number; offset: number; limit: number; verses: Verse[] }> {
    const emptyResult = { query, bibleId, total: 0, offset, limit, verses: [] };
    if (!query || query.trim().length === 0) return emptyResult;

    const q = query.trim();
    const qLower = q.toLowerCase();
    const results: Verse[] = [];

    // 1. Try parsing query as a Bible reference (e.g. "John 3:16", "John 3", "1 Corinthians 13:4", "Psalm 23:1")
    const refRegex = /^([1-3]?\s*[A-Za-z]+)\s+(\d+)(?::(\d+))?$/i;
    const refMatch = q.match(refRegex);

    if (refMatch) {
      const bookQuery = refMatch[1].trim().toLowerCase();
      const chapterNum = parseInt(refMatch[2], 10);
      const verseNum = refMatch[3] ? parseInt(refMatch[3], 10) : null;

      const matchedBook = BIBLE_BOOKS.find(
        b => b.name.toLowerCase() === bookQuery || b.abbr.toLowerCase() === bookQuery || b.id.toLowerCase() === bookQuery
      );

      if (matchedBook) {
        const chapterId = `${matchedBook.id}.${chapterNum}`;
        const chapterRes = await this.getChapter(bibleId, chapterId);
        if (chapterRes && chapterRes.verses) {
          if (verseNum !== null) {
            const foundVerse = chapterRes.verses.find(v => v.number === verseNum);
            if (foundVerse) {
              results.push(foundVerse);
            }
          } else {
            results.push(...chapterRes.verses);
          }
        }
      }
    }

    // 2. Keyword/phrase search in curated chapter text
    if (results.length === 0) {
      for (const [key, verses] of Object.entries(KNOWN_CHAPTER_VERSES)) {
        const parts = key.split('.');
        const bookId = parts[0];
        const chapterNum = parts[1];
        const bookDef = BIBLE_BOOKS.find(b => b.id === bookId);

        for (const v of verses) {
          if (v.text.toLowerCase().includes(qLower) || (bookDef && bookDef.name.toLowerCase().includes(qLower))) {
            results.push({
              id: `${key}.${v.number}`,
              chapterId: key,
              bookId,
              number: v.number,
              text: v.text,
              reference: `${bookDef ? bookDef.name : bookId} ${chapterNum}:${v.number}`,
            });
          }
        }
      }
    }

    const total = results.length;
    const paginatedVerses = results.slice(offset, offset + limit);

    return {
      query,
      bibleId,
      total,
      offset,
      limit,
      verses: paginatedVerses,
    };
  }

  async getVerseOfDay(dateStr?: string): Promise<DailyVerse> {
    return getDeterministicDailyVerse(dateStr || new Date());
  }

  async getDevotional(): Promise<DailyDevotional> {
    return DAILY_DEVOTIONAL;
  }
}
