import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { UserRecord } from '../db/types';

export const JWT_SECRET = process.env.JWT_SECRET || 'hb_jwt_secret_2026_super_secure_key_x99';

export interface AuthRequest extends Request {
  user?: UserRecord;
}

export function generateToken(user: UserRecord): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    let user = db.findUserById(payload.id);
    if (!user) {
      user = await db.findUserByIdAsync(payload.id);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account is inactive or no longer exists.' });
    }

    req.user = user;
    db.recordActivity(user.id);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token. Please sign in again.' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access denied. Administrator privileges are required to view this resource.',
    });
  }

  next();
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
      let user = db.findUserById(payload.id);
      if (!user) {
        user = await db.findUserByIdAsync(payload.id);
      }
      if (user && user.isActive) {
        req.user = user;
        db.recordActivity(user.id);
      }
    } catch {
      // Ignore invalid optional tokens
    }
  }

  next();
}
