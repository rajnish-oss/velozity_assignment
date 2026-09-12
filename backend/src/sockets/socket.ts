import type { Server, Socket } from 'socket.io';
import { db } from '../prisma/db';

type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
type SocketUser = { id: string; role: UserRole };

const COMMON_ROOM = 'common-room';
const socketsByUser = new Map<string, Set<string>>();
let socketServer: Server | null = null;

export type TaskStatusActivity = {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  actorName: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: unknown;
};

async function recentActivitiesFor(user: SocketUser) {
  let taskIds: string[] | undefined;
  if (user.role === 'PROJECT_MANAGER') {
    const projects = await db.orm.public.Project.where({ ownerId: user.id }).select('id').all();
    const tasks = await db.orm.public.Task.where((task) => task.projectId.in(projects.map((project) => project.id))).select('id').all();
    taskIds = tasks.map((task) => task.id);
  } else if (user.role === 'DEVELOPER') {
    const tasks = await db.orm.public.Task.where({ assigneeId: user.id }).select('id').all();
    taskIds = tasks.map((task) => task.id);
  }

  let query = db.orm.public.ActivityLog;
  if (taskIds) query = query.where((activity) => activity.taskId.in(taskIds));
  const activities = await query.orderBy((activity) => activity.createdAt.desc()).limit(50).all();
  if (!activities.length) return [];

  const tasks = await db.orm.public.Task.where((task) => task.id.in([...new Set(activities.map((activity) => activity.taskId))])).all();
  const users = await db.orm.public.User.where((account) => account.id.in([...new Set(activities.map((activity) => activity.userId))])).select('id', 'name').all();
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const userById = new Map(users.map((account) => [account.id, account]));
  return activities.flatMap((activity) => {
    const task = taskById.get(activity.taskId);
    const actor = userById.get(activity.userId);
    return task && actor ? [{ ...activity, projectId: task.projectId, taskTitle: task.title, actorName: actor.name }] : [];
  });
}

/** Deliver a persisted activity only to users permitted to see it. */
export function emitTaskStatusChanged(
  task: { assigneeId: string | null; projectId: string },
  activity: TaskStatusActivity,
) {
  if (!socketServer) return;

  const payload = { task, activity };
  // Admins receive the global feed, PMs receive their project's room, and a
  // developer receives an event only for a task currently assigned to them.
  socketServer.to('admin-feed').emit('task:status_changed', payload);
  socketServer.to(`project:${task.projectId}`).emit('task:status_changed', payload);
  if (task.assigneeId) {
    socketServer.to(`user:${task.assigneeId}`).emit('task:status_changed', payload);
  }
}

async function getProjectIdsForUser(user: SocketUser): Promise<string[]> {
  if (user.role === 'ADMIN') return [];
  if (user.role === 'PROJECT_MANAGER') {
    const projects = await db.orm.public.Project.where({ ownerId: user.id }).select('id').all();
    return projects.map((project) => project.id);
  }
  // Developers use their per-user room below. Joining every project containing
  // one of their tasks would leak activity for other developers' tasks.
  return [];
}

function updatePresence(io: Server) {
  // A user may have several browser tabs. The dashboard reports people, not
  // socket connections, so use the distinct authenticated users in the common room.
  io.to(COMMON_ROOM).emit('presence:updated', { onlineCount: socketsByUser.size });
}

function socketUser(socket: Socket): SocketUser | null {
  const user = socket.data.user as { id?: unknown; role?: unknown } | undefined;
  if (typeof user?.id !== 'string' || (user.role !== 'ADMIN' && user.role !== 'PROJECT_MANAGER' && user.role !== 'DEVELOPER')) return null;
  return { id: user.id, role: user.role };
}

export function handleSocketConnection(io: Server) {
  socketServer = io;
  io.on('connection', async (socket) => {
    const user = socketUser(socket);
    if (!user) {
      socket.disconnect(true);
      return;
    }

    try {
      await socket.join(COMMON_ROOM);
      await socket.join(`user:${user.id}`);
      if (user.role === 'ADMIN') await socket.join('admin-feed');
      else {
        const projectIds = await getProjectIdsForUser(user);
        await Promise.all(projectIds.map((projectId) => socket.join(`project:${projectId}`)));
      }

      const userSockets = socketsByUser.get(user.id) ?? new Set<string>();
      userSockets.add(socket.id);
      socketsByUser.set(user.id, userSockets);
      updatePresence(io);
      socket.emit('socket:ready', { socketId: socket.id });
      socket.emit('activity:catchup', { activities: await recentActivitiesFor(user) });

      let disconnected = false;
      socket.once('disconnect', () => {
        if (disconnected) return;
        disconnected = true;
        const userSockets = socketsByUser.get(user.id);
        userSockets?.delete(socket.id);
        if (userSockets?.size === 0) socketsByUser.delete(user.id);
        updatePresence(io);
      });
    } catch {
      socket.disconnect(true);
    }
  });
}
