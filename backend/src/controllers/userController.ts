import type { Request, Response } from 'express';
import { db } from '../prisma/db';

/** Returns only the directory fields needed to display owners and assignees. */
export async function listUsers(_req: Request, res: Response) {
  try {
    const users = await db.orm.public.User
      .select('id', 'name', 'role')
      .orderBy((user) => user.name.asc())
      .all();
    return res.status(200).json({ users });
  } catch {
    return res.status(500).json({ error: 'Unable to fetch users' });
  }
}
