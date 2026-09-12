import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../prisma/db';

declare global {
  namespace Express {
    interface Request {
      user?: jwt.JwtPayload;
    }
  }
}

const jwt_secret = process.env.JWT_SECRET

if(!jwt_secret) {
    throw new Error('JWT_SECRET is not defined')
}
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
     const authHeader = req.headers['authorization'];
     const token = authHeader && authHeader.split(' ')[1];

     if (!token) {
        return res.status(401).json({ message: 'Token missing' });
    }

    jwt.verify(token, jwt_secret, (err, decoded) => {
    if (err || !decoded || typeof decoded === 'string') {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
    });
}

export const autherizationCheck = (req: Request, res: Response, next: NextFunction, role: string[]) => {
    const id = req.user?.sub;

    if(typeof id !== 'string') {
        return res.status(403).json({ error: 'user not found' });
    }

    db.orm.public.User.findUnique({
        where: { id }
    }).then(user => {
        if(user && role.includes(user.role)) {
            next();
        }else{
            return res.status(403).json({ error: 'unauthorized' });
        }
    }).catch(err => {
        return res.status(403).json({ error: 'user not found' });
    })
}
