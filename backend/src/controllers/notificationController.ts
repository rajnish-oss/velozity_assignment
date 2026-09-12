import type { Request, Response } from 'express';
import { db } from '../prisma/db';
import { getAuthenticatedUser } from '../middlerware/authMiddleware';

function currentUserId(req: Request): string | null {
  return getAuthenticatedUser(req)?.id ?? null;
}

export async function listNotifications(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const notifications = await db.orm.public.Notification.where({ userId }).orderBy((notification) => notification.createdAt.desc()).all();
    return res.status(200).json({ notifications });
  } catch {
    return res.status(500).json({ error: 'Unable to fetch notifications' });
  }
}

export async function markNotificationsRead(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id, ids } = req.body as { id?: unknown; ids?: unknown };
    if (id !== undefined && typeof id !== 'string') return res.status(400).json({ error: 'id must be a string' });
    if (ids !== undefined && (!Array.isArray(ids) || !ids.every((value) => typeof value === 'string'))) return res.status(400).json({ error: 'ids must be an array of strings' });

    let query = db.orm.public.Notification.where({ userId });
    if (typeof id === 'string') query = query.where({ id });
    else if (Array.isArray(ids)) query = query.where((notification) => notification.id.in(ids));
    const notifications = await query.update({ isRead: true });
    return res.status(200).json({ notifications });
  } catch {
    return res.status(500).json({ error: 'Unable to mark notifications as read' });
  }
}
