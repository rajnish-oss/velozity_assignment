import type { Request, Response } from 'express';
import { db } from '../prisma/db';
import { getAuthenticatedUser } from '../middlerware/authMiddleware';

type ActivityLog = {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: unknown;
};

export async function enrichActivities(activities: ActivityLog[]) {
  if (!activities.length) return [];

  const taskIds = [...new Set(activities.map((activity) => activity.taskId))];
  const userIds = [...new Set(activities.map((activity) => activity.userId))];
  const [tasks, users] = await Promise.all([
    db.orm.public.Task.where((task) => task.id.in(taskIds)).all(),
    db.orm.public.User.where((user) => user.id.in(userIds)).select('id', 'name').all(),
  ]);
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const userById = new Map(users.map((user) => [user.id, user]));

  return activities.flatMap((activity) => {
    const task = taskById.get(activity.taskId);
    const actor = userById.get(activity.userId);
    if (!task || !actor) return [];
    return [{ ...activity, projectId: task.projectId, taskTitle: task.title, actorName: actor.name }];
  });
}

export async function listActivities(req: Request, res: Response) {
  try {
    const user = getAuthenticatedUser(req);
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
    return res.status(200).json({ activities: await enrichActivities(activities) });
  } catch {
    return res.status(500).json({ error: 'Unable to fetch activities' });
  }
}
