import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getOrCreateUser } from '../db/users.ts';

/**
 * Extended Express Request interface incorporating authenticated user information.
 */
export interface AuthRequest extends Request {
  user?: DecodedIdToken | { uid: string; email: string };
}

/**
 * Express Middleware: requireAuth
 *
 * Verifies incoming Firebase Auth Bearer tokens in the HTTP Authorization header.
 * If no token is provided or verification fails (e.g. during local single-user dev mode or anonymous sessions),
 * falls back gracefully to a default coach user account ('default-user').
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.ALLOW_DEV_AUTH_FALLBACK === 'true') {
      req.user = { uid: 'default-user', email: 'coach.alex@gympayfit.com' };
    } else {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
  } else {
    const token = authHeader.split('Bearer ')[1];
    try {
      // Attempt to verify Firebase ID token using Firebase Admin SDK
      req.user = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.warn("Token verification failed", error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  }

  try {
    // Ensure the user exists in the database to satisfy foreign key constraints
    await getOrCreateUser(req.user.uid, req.user.email || 'coach.alex@gympayfit.com');
  } catch (dbError) {
    console.error("Failed to provision user in requireAuth", dbError);
    return res.status(500).json({ error: "Failed to provision user session" });
  }

  next();
};

