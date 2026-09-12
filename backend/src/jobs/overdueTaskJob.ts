import cron from 'node-cron';
import { Temporal } from '@js-temporal/polyfill';
import { db } from '../prisma/db';

export async function markOverdueTasks() {
  const now = Temporal.Now.instant();
  const tasks = await db.orm.public.Task
    .where((task) => task.dueDate.lt(now))
    .all();

  const overdueTasks = tasks.filter(
    (task) => task.status !== 'DONE' && task.status !== 'OVERDUE',
  );

  for (const task of overdueTasks) {
    await db.orm.public.Task.where({ id: task.id }).update({ status: 'OVERDUE' });

    if (task.assigneeId) {
      await db.orm.public.Notification.create({
        userId: task.assigneeId,
        message: `Task "${task.title}" is overdue.`,
      });
    }
  }

  return overdueTasks.length;
}

export function startOverdueTaskScheduler() {
  cron.schedule('* * * * *', () => {
    void markOverdueTasks().catch((error) => {
      console.error('Unable to mark overdue tasks:', error);
    });
  });
}