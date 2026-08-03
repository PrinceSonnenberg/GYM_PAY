import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken | { uid: string; email: string };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.ALLOW_DEV_AUTH_FALLBACK === 'true') {
      req.user = { uid: 'default-user', email: 'coach.alex@gympayfit.com' };
      return next();
    }
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    if (process.env.ALLOW_DEV_AUTH_FALLBACK === 'true') {
      console.warn('Firebase ID token verification fallback to default user:', error);
      req.user = { uid: 'default-user', email: 'coach.alex@gympayfit.com' };
      return next();
    }
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};
