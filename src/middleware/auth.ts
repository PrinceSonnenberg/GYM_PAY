import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

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

  // Check if Bearer token header is present
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { uid: 'default-user', email: 'coach.alex@gympayfit.com' };
    return next();
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Attempt to verify Firebase ID token using Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    // Fallback to default user session if token verification fails
    req.user = { uid: 'default-user', email: 'coach.alex@gympayfit.com' };
    return next();
  }
};

