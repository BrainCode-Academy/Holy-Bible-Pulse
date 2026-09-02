import express from 'express';
import { bibleManager } from './bibleProviders/ProviderManager';
import authRoutes from './routes/authRoutes';
import userSyncRoutes from './routes/userSyncRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import adminRoutes from './routes/adminRoutes';
import { storageService } from './services/storageService';

/**
 * Express Application Instance
 * Reusable across:
 * 1. Standalone Node.js server (server.ts)
 * 2. Vercel Serverless Function (api/index.ts)
 */
export function createExpressApp() {
  const app = express();

  // Support up to 10MB payloads for profile images
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Production-grade CORS middleware
  // Strictly handles: Capacitor Android, iOS, localhost, and Vercel web domains
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    const isAllowedOrigin = (testOrigin: string): boolean => {
      if (!testOrigin) return false;
      // Local development and Capacitor native schemes
      if (
        testOrigin === 'capacitor://localhost' ||
        testOrigin === 'https://localhost' ||
        testOrigin === 'http://localhost' ||
        testOrigin.startsWith('http://localhost:') ||
        testOrigin.startsWith('https://localhost:') ||
        testOrigin.startsWith('http://127.0.0.1:') ||
        testOrigin.startsWith('https://127.0.0.1:')
      ) {
        return true;
      }
      // Vercel deployment domains
      if (testOrigin.endsWith('.vercel.app') || testOrigin.includes('vercel.app')) {
        return true;
      }
      // Custom production domain if specified via environment
      if (process.env.ALLOWED_ORIGIN && testOrigin === process.env.ALLOWED_ORIGIN) {
        return true;
      }
      return false;
    };

    if (origin) {
      if (isAllowedOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        // Fallback for general public API consumption
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Session-Id'
    );

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Log requests in dev / debug
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.url}`);
    }
    next();
  });

  // Serve uploaded avatars with automatic Cloud Firestore recovery
  app.get('/api/uploads/avatars/:filename', async (req, res) => {
    try {
      const result = await storageService.getImage(req.params.filename);
      if (!result) {
        return res.status(404).json({ error: 'Avatar image not found' });
      }
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(result.buffer);
    } catch (err) {
      console.error('[API] Error serving avatar:', err);
      return res.status(500).json({ error: 'Failed to retrieve avatar' });
    }
  });

  app.get('/api/user/avatar/:userId', async (req, res) => {
    try {
      const result = await storageService.getImage(req.params.userId);
      if (!result) {
        return res.status(404).json({ error: 'Avatar image not found' });
      }
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(result.buffer);
    } catch (err) {
      console.error('[API] Error serving avatar by userId:', err);
      return res.status(500).json({ error: 'Failed to retrieve avatar' });
    }
  });

  // --- AUTH, USER SYNC, ANALYTICS & ADMIN ROUTES ---
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userSyncRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/admin', adminRoutes);

  // --- SCRIPTURE API ROUTES ---

  // Health and Provider Configuration Status (Publicly queryable)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/status', (req, res) => {
    res.json({
      status: 'ok',
      apiBibleKeyPresent: bibleManager.isApiBibleKeyConfigured(),
      activeProvider: bibleManager.isApiBibleKeyConfigured() ? 'API.Bible + Public Domain' : 'Public Domain Engine',
      providers: bibleManager.getProvidersInfo(),
      timestamp: new Date().toISOString(),
    });
  });

  // Get List of Available Bibles / Translations
  app.get('/api/bibles', async (req, res) => {
    try {
      const language = req.query.language as string | undefined;
      const bibles = await bibleManager.getAllAvailableBibles(language);
      res.json(bibles);
    } catch (err) {
      console.error('Error fetching Bibles:', err);
      res.status(500).json({ error: 'Failed to fetch Bibles' });
    }
  });

  // Get Single Bible metadata
  app.get('/api/bibles/:bibleId', async (req, res) => {
    try {
      const bible = await bibleManager.getBible(req.params.bibleId);
      if (!bible) {
        return res.status(404).json({ error: 'Bible translation not found' });
      }
      res.json(bible);
    } catch (err) {
      console.error('Error fetching Bible metadata:', err);
      res.status(500).json({ error: 'Failed to fetch Bible details' });
    }
  });

  // Get Books list for given Bible ID
  app.get('/api/bibles/:bibleId/books', async (req, res) => {
    try {
      const books = await bibleManager.getBooks(req.params.bibleId);
      res.json(books);
    } catch (err) {
      console.error('Error fetching books:', err);
      res.status(500).json({ error: 'Failed to fetch books' });
    }
  });

  // Get Chapters list for given Bible ID and Book ID
  app.get('/api/bibles/:bibleId/books/:bookId/chapters', async (req, res) => {
    try {
      const { bibleId, bookId } = req.params;
      const chapters = await bibleManager.getBookChapters(bibleId, bookId);
      res.json(chapters);
    } catch (err) {
      console.error('Error fetching chapters list:', err);
      res.status(500).json({ error: 'Failed to fetch chapters list' });
    }
  });

  // Get Chapter & Verses for given Bible ID and Chapter ID (e.g. GEN.1 or PSA.23)
  app.get('/api/bibles/:bibleId/chapters/:chapterId', async (req, res) => {
    try {
      const { bibleId, chapterId } = req.params;
      const result = await bibleManager.getChapter(bibleId, chapterId);
      if (!result) {
        return res.status(404).json({ error: 'Chapter not found' });
      }
      res.json(result);
    } catch (err) {
      console.error('Error fetching chapter:', err);
      res.status(500).json({ error: 'Failed to fetch chapter scripture' });
    }
  });

  // Search Scripture
  app.get('/api/search', async (req, res) => {
    try {
      const query = (req.query.q as string) || '';
      const bibleId = (req.query.bibleId as string) || 'web';
      const limit = parseInt(req.query.limit as string) || 25;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!query.trim()) {
        return res.json({ query: '', bibleId, total: 0, offset: 0, limit, count: 0, verses: [] });
      }

      const searchRes = await bibleManager.search(bibleId, query, limit, offset);
      res.json({
        ...searchRes,
        count: searchRes.verses.length,
      });
    } catch (err) {
      console.error('Error searching scripture:', err);
      res.status(500).json({ error: 'Failed to complete search. Please try again.' });
    }
  });

  // Verse of the Day
  app.get('/api/verse-of-the-day', async (req, res) => {
    try {
      const dateParam = (req.query.date as string) || undefined;
      const votd = await bibleManager.getVerseOfDay(dateParam);
      res.json(votd);
    } catch (err) {
      console.error('Error fetching Verse of the Day:', err);
      res.status(500).json({ error: 'Failed to fetch verse of the day' });
    }
  });

  // Daily Devotional
  app.get('/api/devotional', async (req, res) => {
    try {
      const devotional = await bibleManager.getDevotional();
      res.json(devotional);
    } catch (err) {
      console.error('Error fetching devotional:', err);
      res.status(500).json({ error: 'Failed to fetch devotional' });
    }
  });

  return app;
}

export const app = createExpressApp();
