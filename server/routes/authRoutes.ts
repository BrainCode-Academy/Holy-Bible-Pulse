import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { db } from '../db/database';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { storageService } from '../services/storageService';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email regex validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 1. POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const fullName = req.body.fullName || req.body.name || req.body.displayName;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.findUserByEmailAsync(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Create user (role always forced to USER for public signup)
    const newUser = await db.createUser({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      authProvider: 'local',
      role: 'USER',
    });

    const token = generateToken(newUser);

    // Record analytics
    const sessionId = (req.headers['x-session-id'] as string) || 'sess_reg_' + newUser.id;
    db.recordAnalyticsEvent('account_created', newUser.id, sessionId, {
      method: 'email',
    });
    db.recordAnalyticsEvent('login', newUser.id, sessionId, {
      method: 'email',
    });

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: db.sanitizeUser(newUser),
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create account.' });
  }
});

// 2. POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.findUserByEmailAsync(normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        error: 'This account was registered using Google Sign-In. Please sign in with Google.',
      });
    }

    const isMatch = await db.verifyPassword(user, password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    db.recordLogin(user.id);
    const token = generateToken(user);

    const sessionId = (req.headers['x-session-id'] as string) || 'sess_log_' + user.id;
    db.recordAnalyticsEvent('login', user.id, sessionId, {
      method: 'email',
    });

    return res.json({
      message: 'Signed in successfully',
      token,
      user: db.sanitizeUser(user),
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred during sign-in.' });
  }
});

// 3. POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential, clientId } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential token.' });
    }

    let payload: any = null;

    try {
      // Real verification with Google Identity Services backend
      const expectedAudience = process.env.GOOGLE_CLIENT_ID || clientId;
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: expectedAudience ? [expectedAudience] : undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn('Google verifyIdToken error:', verifyErr);
      // If token decoding fails entirely, reject
      return res.status(401).json({
        error: 'Google ID token verification failed. Please check Google OAuth client setup.',
      });
    }

    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ error: 'Invalid Google user payload.' });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const fullName = payload.name || payload.given_name || 'Bible Reader';
    const avatarUrl = payload.picture || null;

    let user = await db.findUserByGoogleIdAsync(googleId);
    let isNewUser = false;

    if (!user) {
      // Check if user exists with the same email
      user = await db.findUserByEmailAsync(email);
      if (user) {
        // Link googleId to existing user; preserve existing custom avatar/profile image type if already set
        const shouldSetGoogleAvatar = !user.avatarUrl && !user.avatarId && user.profileImageType !== 'uploaded_photo' && user.profileImageType !== 'avatar';
        await db.updateUser(user.id, {
          googleId,
          ...(shouldSetGoogleAvatar ? { avatarUrl, profileImageType: avatarUrl ? 'uploaded_photo' : 'default' } : {}),
        });
      } else {
        // Create new Google user
        user = await db.createUser({
          fullName,
          email,
          googleId,
          avatarUrl,
          profileImageType: avatarUrl ? 'uploaded_photo' : 'default',
          authProvider: 'google',
          role: 'USER',
        });
        isNewUser = true;
      }
    } else {
      // User exists with Google ID: Never overwrite user's chosen custom picture or custom avatar
      const hasCustomAvatar = user.profileImageType === 'uploaded_photo' || user.profileImageType === 'avatar' || !!user.avatarId;
      if (!hasCustomAvatar && !user.avatarUrl && avatarUrl) {
        await db.updateUser(user.id, {
          avatarUrl,
          profileImageType: 'uploaded_photo',
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }

    db.recordLogin(user.id);
    const token = generateToken(user);

    const sessionId = (req.headers['x-session-id'] as string) || 'sess_goog_' + user.id;
    if (isNewUser) {
      db.recordAnalyticsEvent('account_created', user.id, sessionId, { method: 'google' });
    }
    db.recordAnalyticsEvent('login', user.id, sessionId, { method: 'google' });

    return res.json({
      message: 'Signed in with Google successfully',
      token,
      user: db.sanitizeUser(user),
    });
  } catch (err: any) {
    console.error('Google auth endpoint error:', err);
    return res.status(500).json({ error: 'Failed to authenticate with Google.' });
  }
});

// 4. GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({
    user: db.sanitizeUser(req.user),
  });
});

// 5. PUT /api/auth/profile (Update Name / Avatar Settings)
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { fullName, avatarUrl, profileImageType, avatarId, avatarBgColor } = req.body;
    const updates: any = {};

    if (fullName && typeof fullName === 'string' && fullName.trim()) {
      updates.fullName = fullName.trim();
    }
    if (avatarUrl !== undefined) {
      updates.avatarUrl = avatarUrl;
    }
    if (profileImageType !== undefined) {
      updates.profileImageType = profileImageType;
    }
    if (avatarId !== undefined) {
      updates.avatarId = avatarId;
    }
    if (avatarBgColor !== undefined) {
      updates.avatarBgColor = avatarBgColor;
    }

    const updatedUser = await db.updateUser(req.user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'Profile updated successfully',
      user: db.sanitizeUser(updatedUser),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 5.1 POST /api/auth/profile/avatar (Upload Real Cropped Profile Picture)
router.post('/profile/avatar', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: 'Please provide valid image data and mime type.' });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid file format. Supported formats are JPG, JPEG, PNG, and WebP.',
      });
    }

    // Strip data url prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9-+.]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Limit maximum file size to 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: 'Image file size exceeds the 5MB limit. Please choose a smaller image.',
      });
    }

    // Verify buffer magic bytes for real image integrity
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    const isWebp =
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      return res.status(400).json({
        error: 'The uploaded file is not a valid image. Non-image files are rejected.',
      });
    }

    // Save image to dedicated storage provider
    const saved = await storageService.saveImage(req.user.id, buffer, mimeType);

    // If user already had a previous local avatar, delete it to keep storage tidy
    if (req.user.avatarUrl && req.user.avatarUrl.startsWith('/api/uploads/avatars/')) {
      const oldFilename = req.user.avatarUrl.replace('/api/uploads/avatars/', '');
      storageService.deleteImage(oldFilename).catch(() => {});
    }

    // Associate new image URL with user's persistent record
    const updatedUser = await db.updateUser(req.user.id, {
      avatarUrl: saved.url,
      profileImageType: 'uploaded_photo',
      avatarId: null,
      avatarBgColor: null,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'Profile picture saved.',
      avatarUrl: saved.url,
      user: db.sanitizeUser(updatedUser),
    });
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return res.status(500).json({ error: 'Unable to save your profile picture. Please try again.' });
  }
});

// 5.2 POST /api/auth/profile/avatar-choice (Choose Predefined/Themed Avatar)
router.post('/profile/avatar-choice', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { avatarId, avatarBgColor } = req.body;
    if (!avatarId || typeof avatarId !== 'string') {
      return res.status(400).json({ error: 'Please choose a valid avatar.' });
    }

    // If user had a previous local disk avatar, clean it up
    if (req.user.avatarUrl && req.user.avatarUrl.startsWith('/api/uploads/avatars/')) {
      const oldFilename = req.user.avatarUrl.replace('/api/uploads/avatars/', '');
      storageService.deleteImage(oldFilename).catch(() => {});
    }

    const updatedUser = await db.updateUser(req.user.id, {
      avatarUrl: null,
      profileImageType: 'avatar',
      avatarId: avatarId.trim(),
      avatarBgColor: avatarBgColor ? String(avatarBgColor).trim() : null,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'Avatar updated successfully.',
      user: db.sanitizeUser(updatedUser),
    });
  } catch (err: any) {
    console.error('Avatar choice error:', err);
    return res.status(500).json({ error: 'Unable to save your avatar. Please try again.' });
  }
});

// 5.3 DELETE /api/auth/profile/avatar (Remove Uploaded Profile Picture)
router.delete('/profile/avatar', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.avatarUrl && req.user.avatarUrl.startsWith('/api/uploads/avatars/')) {
      const filename = req.user.avatarUrl.replace('/api/uploads/avatars/', '');
      storageService.deleteImage(filename).catch(() => {});
    }

    const updatedUser = await db.updateUser(req.user.id, {
      avatarUrl: null,
      profileImageType: 'default',
      avatarId: null,
      avatarBgColor: null,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'Profile picture removed successfully.',
      user: db.sanitizeUser(updatedUser),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unable to remove profile picture. Please try again.' });
  }
});

// 6. POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const normalized = email.trim().toLowerCase();
    const user = await db.findUserByEmailAsync(normalized);

    // If no user or Google-only user, return generic success message to prevent user enumeration
    if (!user || !user.passwordHash) {
      return res.json({
        message: 'If an account exists with that email, password reset instructions have been generated.',
      });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    await db.setPasswordResetToken(normalized, resetToken, 60);

    return res.json({
      message: 'Password reset token generated successfully.',
      resetToken, // Returned for sandbox convenience and user test flow
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process forgot password request.' });
  }
});

// 7. POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Please provide a valid token and password of at least 6 characters.' });
    }

    const user = await db.findUserByResetTokenAsync(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    await db.setUserPassword(user.id, newPassword);

    return res.json({
      message: 'Your password has been reset successfully. You can now log in with your new password.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// 8. POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!req.user.passwordHash) {
      return res.status(400).json({
        error: 'Google Sign-In accounts do not have a local password.',
      });
    }

    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: 'New password must be at least 6 characters long.',
      });
    }

    const isMatch = await db.verifyPassword(req.user, oldPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    await db.setUserPassword(req.user.id, newPassword);

    return res.json({ message: 'Password changed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

// 9. POST /api/auth/logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const sessionId = (req.headers['x-session-id'] as string) || 'sess_out';

  // If user was signed in, log analytics
  db.recordAnalyticsEvent('logout', null, sessionId);

  return res.json({ message: 'Signed out successfully' });
});

export default router;
