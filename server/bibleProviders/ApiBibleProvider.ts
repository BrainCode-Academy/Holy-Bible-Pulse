import { IBibleProvider } from './types';
import { Bible, Book, Chapter, Verse, DailyVerse, DailyDevotional } from '../../src/types';
import { BIBLE_BOOKS, DAILY_VERSES, DAILY_DEVOTIONAL } from './publicDomainData';
import { bibleCache } from '../services/cache';

export class ApiBibleProvider implements IBibleProvider {
  id = 'api_bible';
  name = 'API.Bible Provider';
  private baseUrl = 'https://api.scripture.api.bible/v1';

  private getKey(): string | null {
    const key = process.env.API_BIBLE_KEY;
    if (!key || key.trim() === '' || key === 'MY_API_BIBLE_KEY' || key === 'API_BIBLE_KEY') {
      return null;
    }
    return key.trim();
  }

  isAvailable(): boolean {
    return this.getKey() !== null;
  }

  private async fetchApi<T>(endpoint: string): Promise<T | null> {
    const apiKey = this.getKey();
    if (!apiKey) return null;

    const cacheKey = `apibible:${endpoint}`;
    const cached = bibleCache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'api-key': apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`[API.Bible Error] HTTP ${response.status} for ${endpoint}`);
        return null;
      }

      const json = await response.json();
      const result = json.data as T;
      if (result) {
        // Cache for 1 hour
        bibleCache.set(cacheKey, result, 3600000);
      }
      return result;
    } catch (err) {
      console.error(`[API.Bible Network Error]`, err);
      return null;
    }
  }

  async getBibles(language?: string): Promise<Bible[]> {
    if (!this.isAvailable()) return [];

    let endpoint = '/bibles';
    if (language) {
      endpoint += `?language=${encodeURIComponent(language)}`;
    }

    interface ApiBibleRes {
      id: string;
      dblId?: string;
      abbreviation: string;
      name: string;
      description?: string;
      language: { id: string; name: string; nameLocal: string };
      copyright?: string;
      info?: string;
    }

    const data = await this.fetchApi<ApiBibleRes[]>(endpoint);
    if (!data) return [];

    const formatAbbr = (rawAbbr: string, name: string) => {
      if (!rawAbbr) return name.substring(0, 4).toUpperCase();
      if (rawAbbr.length > 3 && rawAbbr.toLowerCase().startsWith('eng')) {
        const stripped = rawAbbr.substring(3);
        if (stripped.length >= 2) return stripped;
      }
      return rawAbbr;
    };

    return data.map(b => ({
      id: b.id,
      dblId: b.dblId,
      abbreviation: formatAbbr(b.abbreviation, b.name),
      name: b.name,
      description: b.description,
      language: {
        id: b.language?.id || 'eng',
        name: b.language?.name || 'English',
        nameLocal: b.language?.nameLocal || 'English',
      },
      copyright: b.copyright || 'Licensed via API.Bible',
      infoUrl: b.info,
      isPublicDomain: false,
      provider: 'api.bible',
    }));
  }

  async getBible(bibleId: string): Promise<Bible | null> {
    if (!this.isAvailable()) return null;

    interface ApiBibleSingle {
      id: string;
      dblId?: string;
      abbreviation: string;
      name: string;
      description?: string;
      language: { id: string; name: string; nameLocal: string };
      copyright?: string;
    }

    const b = await this.fetchApi<ApiBibleSingle>(`/bibles/${bibleId}`);
    if (!b) return null;

    let abbr = b.abbreviation || b.name.substring(0, 4).toUpperCase();
    if (abbr.length > 3 && abbr.toLowerCase().startsWith('eng')) {
      const stripped = abbr.substring(3);
      if (stripped.length >= 2) abbr = stripped;
    }

    return {
      id: b.id,
      dblId: b.dblId,
      abbreviation: abbr,
      name: b.name,
      description: b.description,
      language: {
        id: b.language?.id || 'eng',
        name: b.language?.name || 'English',
        nameLocal: b.language?.nameLocal || 'English',
      },
      copyright: b.copyright || 'Licensed via API.Bible',
      isPublicDomain: false,
      provider: 'api.bible',
    };
  }

  async getBooks(bibleId: string): Promise<Book[]> {
    if (!this.isAvailable()) return [];

    interface ApiBook {
      id: string;
      bibleId: string;
      abbreviation: string;
      name: string;
      nameLong?: string;
      chapters?: Array<{ id: string; number: string }>;
    }

    const books = await this.fetchApi<ApiBook[]>(`/bibles/${bibleId}/books`);
    if (!books) return [];

    return books.map((b, idx) => {
      const matchDef = BIBLE_BOOKS.find(def => def.id === b.id.toUpperCase());
      return {
        id: b.id,
        bibleId,
        abbreviation: b.abbreviation || matchDef?.abbr || b.name.substring(0, 4),
        name: b.name,
        nameLong: b.nameLong || matchDef?.nameLong || b.name,
        chaptersCount: b.chapters?.length || matchDef?.chaptersCount || 20,
        testament: matchDef?.testament || (idx < 39 ? 'OT' : 'NT'),
        order: idx + 1,
      };
    });
  }

  async getBookChapters(bibleId: string, bookId: string): Promise<Array<{ id: string; number: string; reference: string }>> {
    if (!this.isAvailable()) return [];

    interface ApiChapterItem {
      id: string;
      bibleId: string;
      number: string;
      bookId: string;
      reference: string;
    }

    const chapters = await this.fetchApi<ApiChapterItem[]>(`/bibles/${bibleId}/books/${bookId}/chapters`);
    if (!chapters) return [];

    // Filter out 'intro' chapter if returned by API.Bible
    return chapters
      .filter(c => c.number !== 'intro')
      .map(c => ({
        id: c.id,
        number: c.number,
        reference: c.reference,
      }));
  }

  async getChapter(bibleId: string, chapterId: string): Promise<{ chapter: Chapter; verses: Verse[] } | null> {
    if (!this.isAvailable()) return null;

    interface ApiChapterData {
      id: string;
      bibleId: string;
      number: string;
      bookId: string;
      reference: string;
      content?: string;
      copyright?: string;
      verseCount?: number;
      next?: { id: string };
      previous?: { id: string };
    }

    const endpoint = `/bibles/${bibleId}/chapters/${chapterId}?include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=true&content-type=html`;
    const chapterRes = await this.fetchApi<ApiChapterData>(endpoint);

    if (!chapterRes) return null;

    let verses: Verse[] = [];

    if (chapterRes.content) {
      verses = this.parseVersesFromHtml(chapterRes.content, chapterId, chapterRes.bookId, chapterRes.reference);
    }

    // Fallback: If HTML parsing returned no verses, attempt to fetch individual verse contents
    if (verses.length === 0) {
      interface ApiVerseSummary {
        id: string;
        reference: string;
      }
      const versesList = await this.fetchApi<ApiVerseSummary[]>(`/bibles/${bibleId}/chapters/${chapterId}/verses`);
      if (versesList && Array.isArray(versesList)) {
        for (let i = 0; i < versesList.length; i++) {
          const v = versesList[i];
          interface ApiSingleVerse {
            content?: string;
          }
          const singleVerse = await this.fetchApi<ApiSingleVerse>(`/bibles/${bibleId}/verses/${v.id}?content-type=text`);
          const verseContent = singleVerse?.content ? singleVerse.content.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim() : '';
          if (verseContent) {
            verses.push({
              id: v.id,
              chapterId,
              bookId: chapterRes.bookId,
              number: i + 1,
              text: verseContent,
              reference: v.reference,
            });
          }
        }
      }
    }

    const chapter: Chapter = {
      id: chapterRes.id,
      bibleId,
      bookId: chapterRes.bookId,
      number: chapterRes.number,
      reference: chapterRes.reference,
      verseCount: verses.length || chapterRes.verseCount || 20,
      previousChapterId: chapterRes.previous?.id,
      nextChapterId: chapterRes.next?.id,
    };

    return { chapter, verses };
  }

  private parseVersesFromHtml(html: string, chapterId: string, bookId: string, baseRef: string): Verse[] {
    const verses: Verse[] = [];
    if (!html) return verses;

    // Clean footnotes and cross references
    const cleanHtml = html
      .replace(/<span[^>]*class=["']?f["']?[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<span[^>]*class=["']?note["']?[^>]*>[\s\S]*?<\/span>/gi, '');

    // Regex for verse span markers formatted by API.Bible
    const verseSpanRegex = /<span[^>]*class=["']?v["']?[^>]*>(?:<span[^>]*>)?(\d+)(?:<\/span>)?<\/span>|<span[^>]*data-number=["']?(\d+)["']?[^>]*>/gi;

    const matches: Array<{ num: number; index: number; fullLength: number }> = [];
    let match: RegExpExecArray | null;

    while ((match = verseSpanRegex.exec(cleanHtml)) !== null) {
      const numStr = match[1] || match[2];
      if (numStr) {
        matches.push({
          num: parseInt(numStr, 10),
          index: match.index,
          fullLength: match[0].length,
        });
      }
    }

    if (matches.length === 0) {
      const plainText = cleanHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      if (plainText) {
        verses.push({
          id: `${chapterId}.1`,
          chapterId,
          bookId,
          number: 1,
          text: plainText,
          reference: `${baseRef}:1`,
        });
      }
      return verses;
    }

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const textStart = m.index + m.fullLength;
      const textEnd = i < matches.length - 1 ? matches[i + 1].index : cleanHtml.length;
      const rawText = cleanHtml.substring(textStart, textEnd);
      const text = rawText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

      if (text.length > 0) {
        verses.push({
          id: `${chapterId}.${m.num}`,
          chapterId,
          bookId,
          number: m.num,
          text: text,
          reference: `${baseRef}:${m.num}`,
          formattedText: rawText.trim(),
        });
      }
    }

    return verses;
  }

  async search(
    bibleId: string,
    query: string,
    limit = 25,
    offset = 0
  ): Promise<{ query: string; bibleId: string; total: number; offset: number; limit: number; verses: Verse[] }> {
    const emptyResult = { query, bibleId, total: 0, offset, limit, verses: [] };
    if (!this.isAvailable() || !query || query.trim().length === 0) return emptyResult;

    interface ApiSearchRes {
      query: string;
      limit?: number;
      offset?: number;
      total?: number;
      verseCount?: number;
      verses?: Array<{
        id: string;
        orgId?: string;
        bookId: string;
        chapterId: string;
        text: string;
        reference: string;
      }>;
      passages?: Array<{
        id: string;
        orgId?: string;
        bibleId?: string;
        bookId: string;
        chapterIds?: string[];
        reference: string;
        content: string;
        verseCount?: number;
      }>;
    }

    const endpoint = `/bibles/${bibleId}/search?query=${encodeURIComponent(query.trim())}&limit=${limit}&offset=${offset}`;
    const res = await this.fetchApi<ApiSearchRes>(endpoint);
    if (!res) return emptyResult;

    const verses: Verse[] = [];

    // 1. Process passages if returned (for scripture reference queries like John 3:16)
    if (res.passages && res.passages.length > 0) {
      for (const p of res.passages) {
        const cleanText = p.content
          ? p.content.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
          : '';
        const parts = p.id.split('.');
        const bookId = p.bookId || parts[0] || 'GEN';
        const chapterId = (p.chapterIds && p.chapterIds[0]) || `${bookId}.${parts[1] || '1'}`;
        const verseNum = parseInt(parts[2], 10) || 1;

        verses.push({
          id: p.id,
          chapterId,
          bookId,
          number: verseNum,
          text: cleanText,
          reference: p.reference,
        });
      }
    }

    // 2. Process verses if returned (for keyword or multi-word phrase queries)
    if (res.verses && res.verses.length > 0) {
      for (let i = 0; i < res.verses.length; i++) {
        const v = res.verses[i];
        const cleanText = v.text
          ? v.text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
          : '';
        const parts = v.id.split('.');
        const verseNum = parseInt(parts[2], 10) || (i + 1);

        verses.push({
          id: v.id,
          chapterId: v.chapterId,
          bookId: v.bookId,
          number: verseNum,
          text: cleanText,
          reference: v.reference,
        });
      }
    }

    const total = res.total ?? res.verseCount ?? verses.length;

    return {
      query,
      bibleId,
      total,
      offset,
      limit,
      verses,
    };
  }

  async getVerseOfDay(): Promise<DailyVerse> {
    return DAILY_VERSES[0];
  }

  async getDevotional(): Promise<DailyDevotional> {
    return DAILY_DEVOTIONAL;
  }
}
