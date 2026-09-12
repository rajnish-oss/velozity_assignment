import type { Request, Response } from 'express';
import { db } from '../prisma/db';
import { Temporal } from '@js-temporal/polyfill';
import { getAuthenticatedUser } from '../middlerware/authMiddleware';


export async function dashboardMetrics(req: Request, res: Response) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    let projects;
    let tasks;
    if (user.role === 'ADMIN') {
      [projects, tasks] = await Promise.all([db.orm.public.Project.all(), db.orm.public.Task.all()]);
    } else if (user.role === 'PROJECT_MANAGER') {
      projects = await db.orm.public.Project.where({ ownerId: user.id }).all();
      const projectIds = projects.map((project) => project.id);
      tasks = projectIds.length ? await db.orm.public.Task.where((task) => task.projectId.in(projectIds)).all() : [];
    } else {
      tasks = await db.orm.public.Task.where({ assigneeId: user.id }).all();
      const projectIds = [...new Set(tasks.map((task) => task.projectId))];
      projects = projectIds.length ? await db.orm.public.Project.where((project) => project.id.in(projectIds)).all() : [];
    }

    const now = Temporal.Now.instant();
    const overdueTasks = tasks.filter((task) => task.status !== 'DONE' && Temporal.Instant.compare(task.dueDate, now) < 0);
    const completedTasks = tasks.filter((task) => task.status === 'DONE');
    return res.status(200).json({
      metrics: {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        overdueTasks: overdueTasks.length,
        completedTasks: completedTasks.length,
        openTasks: tasks.length - completedTasks.length,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Unable to fetch dashboard metrics' });
  }
}
