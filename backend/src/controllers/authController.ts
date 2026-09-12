import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { db } from '../prisma/db';
import { Temporal } from '@js-temporal/polyfill';
import { getAuthenticatedUser } from '../middlerware/authMiddleware';

const jwt_secret = process.env.JWT_SECRET
const refresh_jwt_secret = process.env.REFRESH_JWT_SECRET

if(!jwt_secret || !refresh_jwt_secret) {
    throw new Error('JWT_SECRET is not defined')
}

export const signin = async (req: Request, res: Response) => {
    console.log("login hit")
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await db.orm.public.User
        .select('id', 'passwordHash', 'role')
        .where({ email: email.trim().toLowerCase() })
        .first();

    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ sub: user.id, role: user.role }, jwt_secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: user.id }, refresh_jwt_secret, { expiresIn: '7d' });

    const expiresAt = Temporal.Now.instant().add({ hours: 24 * 7 });

    await db.orm.public.RefreshToken.create({
        token: refreshToken,
        userId: user.id,
        expiresAt: expiresAt,
    });

    // 3. Set HttpOnly Cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    return res.status(200).json({ accessToken });
};

export const refresh = async (req: Request, res: Response) => {
    const oldRefreshToken = readCookie(req, 'refreshToken');

    if (!oldRefreshToken) {
        return res.status(401).json({ error: 'Refresh token missing' });
    }

    const storedToken = await db.orm.public.RefreshToken.where({ token: oldRefreshToken }).first();

    if (!storedToken) {
        return res.status(403).json({ error: 'Invalid refresh token' });
    }

    try {
        jwt.verify(oldRefreshToken, refresh_jwt_secret);

        const user = await db.orm.public.User.where({ id: storedToken.userId }).first();
        if (!user) {
            await db.orm.public.RefreshToken.where({ token: oldRefreshToken }).delete();
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        const newAccessToken = jwt.sign(
            { sub: user.id, role: user.role },
            jwt_secret,
            { expiresIn: '15m' }
        );

        const newRefreshToken = jwt.sign(
            { sub: storedToken.userId },
            refresh_jwt_secret,
            { expiresIn: '7d' }
        );

        await db.orm.public.RefreshToken.where({ token: oldRefreshToken }).delete();
        await db.orm.public.RefreshToken.create({
            token: newRefreshToken,
            userId: storedToken.userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ accessToken: newAccessToken });

    } catch (err) {
        await db.orm.public.RefreshToken.where({ token: oldRefreshToken }).delete();
        return res.status(403).json({ error: 'Session expired, please login again' });
    }
};

export const logout = async (req: Request, res: Response) => {
    const refreshToken = readCookie(req, 'refreshToken');
    if (refreshToken) {
        await db.orm.public.RefreshToken.where({ token: refreshToken }).delete();
    }
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
    return res.status(204).send();
};

function readCookie(req: Request, name: string): string | undefined {
    const cookie = req.headers.cookie;
    if (!cookie) return undefined;
    return cookie.split(';').map((part:string) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export const currentUser = async(req: Request, res: Response) => {
    try{
        const user = getAuthenticatedUser(req);
        if (!user) {
            return res.status(403).json({ error: 'user not found' });
        }

        const currentUser = await db.orm.public.User.where({ id: user.id }).first();

        return res.status(200).json({ user: currentUser });
    }catch(err){
        return res.status(403).json({ error: 'user not found' });
    }
}
