import { IBibleProvider } from './types';
import { ApiBibleProvider } from './ApiBibleProvider';
import { PublicDomainBibleProvider } from './PublicDomainProvider';
import { Bible, Book, Chapter, Verse, DailyVerse, DailyDevotional } from '../../src/types';

export class BibleProviderManager {
  private apiBibleProvider: ApiBibleProvider;
  private publicDomainProvider: PublicDomainBibleProvider;

  constructor() {
    this.apiBibleProvider = new ApiBibleProvider();
    this.publicDomainProvider = new PublicDomainBibleProvider();
  }

  public isApiBibleKeyConfigured(): boolean {
    return this.apiBibleProvider.isAvailable();
  }

  public getProvidersInfo() {
    return [
      {
        id: 'public_domain',
        name: 'Public Domain Bible Provider',
        enabled: true,
        description: 'Provides free public domain translations (WEB, KJV, Spanish RVR1909, French LSG1910) with zero API key required.',
      },
      {
        id: 'api_bible',
        name: 'API.Bible Provider',
        enabled: this.isApiBibleKeyConfigured(),
        description: 'Connects securely to API.Bible to unlock licensed translations across hundreds of languages. Requires API_BIBLE_KEY environment variable.',
      },
    ];
  }

  private getProviderForBible(bibleId: string): IBibleProvider {
    const isPublic = ['web', 'kjv', 'rvr1909', 'lsg1910'].includes(bibleId.toLowerCase());
    if (isPublic) {
      return this.publicDomainProvider;
    }
    if (this.apiBibleProvider.isAvailable()) {
      return this.apiBibleProvider;
    }
    return this.publicDomainProvider;
  }

  async getAllAvailableBibles(language?: string): Promise<Bible[]> {
    if (this.apiBibleProvider.isAvailable()) {
      try {
        const apiBibles = await this.apiBibleProvider.getBibles(language);
        if (apiBibles && apiBibles.length > 0) {
          return apiBibles;
        }
      } catch (err) {
        console.warn('Failed to load Bibles from API.Bible, returning public domain list', err);
      }
    }

    return this.publicDomainProvider.getBibles(language);
  }

  async getBible(bibleId: string): Promise<Bible | null> {
    const provider = this.getProviderForBible(bibleId);
    const bible = await provider.getBible(bibleId);
    return bible;
  }

  async getBooks(bibleId: string): Promise<Book[]> {
    const provider = this.getProviderForBible(bibleId);
    const books = await provider.getBooks(bibleId);
    return books || [];
  }

  async getBookChapters(bibleId: string, bookId: string): Promise<Array<{ id: string; number: string; reference: string }>> {
    const provider = this.getProviderForBible(bibleId);
    if (provider === this.apiBibleProvider) {
      const apiChapters = await this.apiBibleProvider.getBookChapters(bibleId, bookId);
      if (apiChapters && apiChapters.length > 0) {
        return apiChapters;
      }
    }

    // Fallback: Generate chapter list based on book chapter count
    const books = await this.getBooks(bibleId);
    const book = books.find(b => b.id.toUpperCase() === bookId.toUpperCase()) || { chaptersCount: 20, name: bookId };
    const chapters: Array<{ id: string; number: string; reference: string }> = [];
    for (let i = 1; i <= book.chaptersCount; i++) {
      chapters.push({
        id: `${bookId}.${i}`,
        number: `${i}`,
        reference: `${book.name} ${i}`,
      });
    }
    return chapters;
  }

  async getChapter(bibleId: string, chapterId: string): Promise<{ chapter: Chapter; verses: Verse[] } | null> {
    const provider = this.getProviderForBible(bibleId);
    let res = await provider.getChapter(bibleId, chapterId);
    if (!res && provider !== this.publicDomainProvider) {
      res = await this.publicDomainProvider.getChapter('web', chapterId);
    }
    return res;
  }

  async search(
    bibleId: string,
    query: string,
    limit = 25,
    offset = 0
  ): Promise<{ query: string; bibleId: string; total: number; offset: number; limit: number; verses: Verse[] }> {
    const provider = this.getProviderForBible(bibleId);
    const result = await provider.search(bibleId, query, limit, offset);
    if ((!result || !result.verses || result.verses.length === 0) && provider !== this.publicDomainProvider) {
      return this.publicDomainProvider.search('web', query, limit, offset);
    }
    return result || { query, bibleId, total: 0, offset, limit, verses: [] };
  }

  async getVerseOfDay(dateStr?: string): Promise<DailyVerse> {
    return this.publicDomainProvider.getVerseOfDay(dateStr);
  }

  async getDevotional(): Promise<DailyDevotional> {
    return this.publicDomainProvider.getDevotional();
  }
}

export const bibleManager = new BibleProviderManager();
