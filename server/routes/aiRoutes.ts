import { Router } from 'express';
import { aiService } from '../services/aiService';

const router = Router();

// POST /api/ai/message-outline
router.post('/message-outline', async (req, res) => {
  try {
    const { topicOrPassage, audience, style, pointsCount, bibleVersion } = req.body;

    if (!topicOrPassage || typeof topicOrPassage !== 'string' || !topicOrPassage.trim()) {
      return res.status(400).json({ error: 'Please provide a topic, theme, or scripture passage.' });
    }

    const outline = await aiService.generateMessageOutline({
      topicOrPassage: topicOrPassage.trim(),
      audience,
      style,
      pointsCount: typeof pointsCount === 'number' ? pointsCount : 3,
      bibleVersion,
    });

    return res.json(outline);
  } catch (err: any) {
    console.error('[AI Routes] Error generating message outline:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate message outline.' });
  }
});

export default router;
