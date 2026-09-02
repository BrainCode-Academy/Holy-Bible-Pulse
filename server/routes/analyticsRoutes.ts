import { Router } from 'express';
import { db } from '../db/database';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/analytics/event
router.post('/event', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { eventType, metadata } = req.body;
    const sessionId = (req.headers['x-session-id'] as string) || req.body.sessionId || 'sess_anon';
    const userId = req.user ? req.user.id : null;

    if (!eventType || typeof eventType !== 'string') {
      return res.status(400).json({ error: 'eventType is required' });
    }

    // Sanitize metadata to avoid recording sensitive personal notes or prayer text
    const safeMetadata: Record<string, string | number | boolean | null> = {};
    if (metadata && typeof metadata === 'object') {
      for (const [key, val] of Object.entries(metadata as Record<string, unknown>)) {
        // Strip sensitive keys
        if (
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('prayertext') ||
          key.toLowerCase().includes('notecontent')
        ) {
          continue;
        }

        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          safeMetadata[key] = val;
        } else if (val === null) {
          safeMetadata[key] = null;
        }
      }
    }

    db.recordAnalyticsEvent(eventType, userId, sessionId, safeMetadata);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record event' });
  }
});

export default router;
