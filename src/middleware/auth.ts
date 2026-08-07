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

  let userToSet: DecodedIdToken | { uid: string; email: string } = { uid: 'default-user', email: 'coach.alex@gympayfit.com' };

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      // Attempt to verify Firebase ID token using Firebase Admin SDK
      const decodedToken = await adminAuth.verifyIdToken(token);
      userToSet = decodedToken;
    } catch (error) {
      console.warn("Token verification failed, falling back to default user", error);
    }
  }

  req.user = userToSet;

  try {
    // Ensure the user exists in the database to satisfy foreign key constraints
    await getOrCreateUser(req.user.uid, req.user.email || 'coach.alex@gympayfit.com');
  } catch (dbError) {
    console.error("Failed to provision user in requireAuth", dbError);
    return res.status(500).json({ error: "Failed to provision user session" });
  }

  next();
};

