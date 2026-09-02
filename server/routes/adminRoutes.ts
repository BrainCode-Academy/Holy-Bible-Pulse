import { Router } from 'express';
import { db } from '../db/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { analyticsService } from '../services/analyticsService';

const router = Router();

// Apply admin guard to all /api/admin/* endpoints
router.use(authenticateToken);
router.use(requireAdmin);

// 1. GET /api/admin/overview
router.get('/overview', (req: AuthRequest, res) => {
  try {
    const overview = analyticsService.getOverview();
    return res.json(overview);
  } catch (err: any) {
    console.error('Admin overview error:', err);
    return res.status(500).json({ error: 'Failed to generate overview statistics' });
  }
});

// 2. GET /api/admin/users
router.get('/users', (req: AuthRequest, res) => {
  try {
    const { q, filter, page = '1', limit = '50' } = req.query;
    let users = db.getAllUsers().map(u => db.sanitizeUser(u));

    // Filter by query string
    if (q && typeof q === 'string' && q.trim()) {
      const search = q.trim().toLowerCase();
      users = users.filter(
        u => u.fullName.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
      );
    }

    // Filter by category
    if (filter && typeof filter === 'string') {
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      if (filter === 'active') {
        users = users.filter(u => u.isActive);
      } else if (filter === 'inactive') {
        users = users.filter(u => !u.isActive);
      } else if (filter === 'google') {
        users = users.filter(u => u.authProvider === 'google');
      } else if (filter === 'email') {
        users = users.filter(u => u.authProvider === 'local');
      } else if (filter === 'new') {
        users = users.filter(u => new Date(u.createdAt).getTime() >= sevenDaysAgo);
      } else if (filter === 'admin') {
        users = users.filter(u => u.role === 'ADMIN');
      }
    }

    // Sort by createdAt descending
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const total = users.length;
    const paginated = users.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.json({
      total,
      page: pageNum,
      limit: limitNum,
      users: paginated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve user list' });
  }
});

// 3. GET /api/admin/users/:userId
router.get('/users/:userId', (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const details = analyticsService.getUserActivitySummary(userId);

    if (!details) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(details);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve user details' });
  }
});

// 4. PUT /api/admin/users/:userId/status
router.put('/users/:userId/status', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { isActive, role } = req.body;

    const user = await db.findUserByIdAsync(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deactivating or demoting themselves
    if (req.user && req.user.id === userId && (isActive === false || role === 'USER')) {
      return res.status(400).json({ error: 'You cannot demote or deactivate your own admin account.' });
    }

    const updates: any = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (role === 'USER' || role === 'ADMIN') updates.role = role;

    const updated = await db.updateUser(userId, updates);

    return res.json({
      message: 'User status updated successfully',
      user: updated ? db.sanitizeUser(updated) : null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

// 5. GET /api/admin/analytics
router.get('/analytics', (req: AuthRequest, res) => {
  try {
    const overview = analyticsService.getOverview();
    const allUsers = db.getAllUsers();
    const allEvents = db.getAnalyticsEvents();

    // Group registrations by day for the last 14 days
    const registrationsByDay: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      registrationsByDay[dateStr] = 0;
    }

    allUsers.forEach(u => {
      const dateStr = u.createdAt.split('T')[0];
      if (registrationsByDay[dateStr] !== undefined) {
        registrationsByDay[dateStr]++;
      }
    });

    return res.json({
      overview,
      registrationsByDay: Object.entries(registrationsByDay).map(([date, count]) => ({ date, count })),
      totalEvents: allEvents.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

export default router;
