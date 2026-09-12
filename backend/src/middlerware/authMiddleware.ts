import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export const ROLES = ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'] as const;
export type UserRole = (typeof ROLES)[number];
export type AuthenticatedUser = { id: string; role: UserRole };
type AuthenticatedRequestUser = jwt.JwtPayload & { sub: string; role: UserRole };

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
    }
  }
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined')
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ROLES.includes(value as UserRole);
}

export function getAuthenticatedUser(req: Request): AuthenticatedUser | null {
  const user = req.user;
  if (!user || typeof user.sub !== 'string' || !isUserRole(user.role)) return null;
  return { id: user.sub, role: user.role };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

     if (!token) {
        return res.status(401).json({ message: 'Token missing' });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err || !decoded || typeof decoded === 'string') {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    if (typeof decoded.sub !== 'string' || !isUserRole(decoded.role)) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = { ...decoded, sub: decoded.sub, role: decoded.role };
    next();
    });
}

export const requireRoles = (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthenticatedUser(req);
    if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}
