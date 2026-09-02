import { Router } from 'express';
import { db } from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/user/sync
router.get('/sync', authenticateToken, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const data = (await db.getUserSyncDataAsync(req.user.id)) || {
      bookmarks: [],
      highlights: [],
      notes: [],
      readingProgress: null,
      readingPlans: [],
      prayerRequests: [],
      readerSettings: null,
      favoriteSongIds: [],
      notificationSettings: null,
      audioSpeed: 1,
      selectedBibleId: 'web',
      votdSelectedBg: '',
    };

    return res.json({ data });
  } catch (err) {
    console.error('Error fetching user sync data:', err);
    return res.status(500).json({ error: 'Failed to retrieve sync data' });
  }
});

// POST /api/user/sync
router.post('/sync', authenticateToken, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const {
    bookmarks,
    highlights,
    notes,
    readingProgress,
    readingPlans,
    prayerRequests,
    readerSettings,
    favoriteSongIds,
    notificationSettings,
    audioSpeed,
    selectedBibleId,
    votdSelectedBg,
  } = req.body;

  db.saveUserSyncData(req.user.id, {
    bookmarks: Array.isArray(bookmarks) ? bookmarks : undefined,
    highlights: Array.isArray(highlights) ? highlights : undefined,
    notes: Array.isArray(notes) ? notes : undefined,
    readingProgress: readingProgress !== undefined ? readingProgress : undefined,
    readingPlans: Array.isArray(readingPlans) ? readingPlans : undefined,
    prayerRequests: Array.isArray(prayerRequests) ? prayerRequests : undefined,
    readerSettings: readerSettings !== undefined ? readerSettings : undefined,
    favoriteSongIds: Array.isArray(favoriteSongIds) ? favoriteSongIds : undefined,
    notificationSettings: notificationSettings !== undefined ? notificationSettings : undefined,
    audioSpeed: typeof audioSpeed === 'number' ? audioSpeed : undefined,
    selectedBibleId: typeof selectedBibleId === 'string' ? selectedBibleId : undefined,
    votdSelectedBg: typeof votdSelectedBg === 'string' ? votdSelectedBg : undefined,
  });

  return res.json({
    success: true,
    message: 'User data synchronized successfully',
    updatedAt: new Date().toISOString(),
  });
});

export default router;
