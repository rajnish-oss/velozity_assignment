import type { Server, Socket } from 'socket.io';
import { db } from '../prisma/db';

type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
type SocketUser = { id: string; role: UserRole };

let onlineConnectionCount = 0;

async function getProjectIdsForUser(user: SocketUser): Promise<string[]> {
  if (user.role === 'ADMIN') return [];
  if (user.role === 'PROJECT_MANAGER') {
    const projects = await db.orm.public.Project.where({ ownerId: user.id }).select('id').all();
    return projects.map((project) => project.id);
  }
  const tasks = await db.orm.public.Task.where({ assigneeId: user.id }).select('projectId').all();
  return [...new Set(tasks.map((task) => task.projectId))];
}

function updatePresence(io: Server, change: 1 | -1) {
  onlineConnectionCount = Math.max(0, onlineConnectionCount + change);
  io.emit('presence:updated', { onlineConnectionCount });
}

function socketUser(socket: Socket): SocketUser | null {
  const user = socket.data.user as { id?: unknown; role?: unknown } | undefined;
  if (typeof user?.id !== 'string' || (user.role !== 'ADMIN' && user.role !== 'PROJECT_MANAGER' && user.role !== 'DEVELOPER')) return null;
  return { id: user.id, role: user.role };
}

export function handleSocketConnection(io: Server) {
  io.on('connection', async (socket) => {
    const user = socketUser(socket);
    if (!user) {
      socket.disconnect(true);
      return;
    }

    try {
      await socket.join(`user:${user.id}`);
      if (user.role === 'ADMIN') await socket.join('admin-feed');
      else {
        const projectIds = await getProjectIdsForUser(user);
        await Promise.all(projectIds.map((projectId) => socket.join(`project:${projectId}`)));
      }

      updatePresence(io, 1);
      socket.emit('socket:ready', { socketId: socket.id });

      let disconnected = false;
      socket.once('disconnect', () => {
        if (disconnected) return;
        disconnected = true;
        updatePresence(io, -1);
      });
    } catch {
      socket.disconnect(true);
    }
  });
}
