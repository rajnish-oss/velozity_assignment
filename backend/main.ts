import 'dotenv/config';
import 'temporal-polyfill/full/global';
import express from 'express';
import cors from 'cors';
import { db } from './src/prisma/db';
import authRouter from './src/routes/authRoutes';
import projectRouter from './src/routes/projectRoutes';
import taskRouter from './src/routes/taskRoutes';
import activityRouter from './src/routes/activityRoutes';
import notificationRouter from './src/routes/notificationRoutes';
import dashboardRouter from './src/routes/dashboardRoutes';
import userRouter from './src/routes/userRoutes';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { handleSocketConnection } from './src/sockets/socket';
import { markOverdueTasks, startOverdueTaskScheduler } from './src/jobs/overdueTaskJob';

const app = express();
const port = Number(process.env['PORT'] ?? 8000);

app.use(cors({
  origin: process.env['CLIENT_ORIGIN'] ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/auth', authRouter);
app.use('/projects', projectRouter);
app.use('/tasks', taskRouter);
app.use('/activities', activityRouter);
app.use('/notifications', notificationRouter);
app.use('/dashboard', dashboardRouter);
app.use('/users', userRouter);

const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: process.env['CLIENT_ORIGIN'] ?? true, credentials: true },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token ?? socket.handshake.headers.authorization?.split(' ')[1];
  const secret = process.env['JWT_SECRET'];
  if (typeof token !== 'string' || !secret) return next(new Error('Unauthorized'));

  try {
    const payload = jwt.verify(token, secret);
    if (
      typeof payload === 'string' ||
      typeof payload.sub !== 'string' ||
      (payload.role !== 'ADMIN' &&
        payload.role !== 'PROJECT_MANAGER' &&
        payload.role !== 'DEVELOPER')
    ) {
      return next(new Error('Unauthorized'));
    }
    socket.data.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

handleSocketConnection(io);

async function start() {
  if (!process.env['DATABASE_URL']) {
    throw new Error('DATABASE_URL is not defined');
  }

  await db.connect({ url: process.env['DATABASE_URL'] });
  await markOverdueTasks();
  startOverdueTaskScheduler();

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  let stopping = false;
  const stop = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`${signal} received; shutting down...`);

    server.close(async (error) => {
      await db.close();
      process.exitCode = error ? 1 : 0;
    });
  };

  process.once('SIGINT', () => void stop('SIGINT'));
  process.once('SIGTERM', () => void stop('SIGTERM'));
}

start().catch(async (error) => {
  console.error(error);
  await db.close();
  process.exitCode = 1;
});
