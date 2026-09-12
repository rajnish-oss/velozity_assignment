import type { Request, Response } from 'express';
import { db } from '../prisma/db';

type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

function currentUser(req: Request): { id: string; role: UserRole } | null {
  const user = req.user as { sub?: unknown; role?: unknown } | undefined;
  if (typeof user?.sub !== 'string' || (user.role !== 'ADMIN' && user.role !== 'PROJECT_MANAGER' && user.role !== 'DEVELOPER')) return null;
  return { id: user.sub, role: user.role };
}

export async function listActivities(req: Request, res: Response) {
  try {
    const user = currentUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    let taskIds: string[] | undefined;
    if (user.role === 'PROJECT_MANAGER') {
      const projects = await db.orm.public.Project.where({ ownerId: user.id }).select('id').all();
      if (!projects.length) return res.status(200).json({ activities: [] });
      const tasks = await db.orm.public.Task.where((task) => task.projectId.in(projects.map((project) => project.id))).select('id').all();
      taskIds = tasks.map((task) => task.id);
    } else if (user.role === 'DEVELOPER') {
      const tasks = await db.orm.public.Task.where({ assigneeId: user.id }).select('id').all();
      if (!tasks.length) return res.status(200).json({ activities: [] });
      taskIds = tasks.map((task) => task.id);
    }

    let query = db.orm.public.ActivityLog;
    if (taskIds) query = query.where((activity) => activity.taskId.in(taskIds!));
    const activities = await query.orderBy((activity) => activity.createdAt.desc()).limit(20).all();
    return res.status(200).json({ activities });
  } catch {
    return res.status(500).json({ error: 'Unable to fetch activities' });
  }
}
