import type { Request, Response } from 'express';
import { db } from '../prisma/db';

type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const TASK_STATUSES: TaskStatus[] = [
  'TO_DO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
];

const TASK_PRIORITIES: TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

declare const Temporal: any;

type AuthenticatedUser = {
  id: string;
  role: UserRole;
};

function getCurrentUser(req: Request): AuthenticatedUser | null {
  const user = req.user as
    | { sub?: unknown; role?: unknown }
    | undefined;

  const id = user?.sub;
  const role = user?.role;

  const validRoles: UserRole[] = [
    'ADMIN',
    'PROJECT_MANAGER',
    'DEVELOPER',
  ];

  if (typeof id !== 'string' || !validRoles.includes(role as UserRole)) {
    return null;
  }

  return {
    id,
    role: role as UserRole,
  };
}


function getTaskId(req: Request): string | null {
  const id = req.params.id;

  return typeof id === 'string' && id.length > 0 ? id : null;
}


function parseInstant(value: unknown): any | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  try {
    return Temporal.Instant.from(value);
  } catch {
    return null;
  }
}

function parseDueDateRange(
  value: unknown,
): { from: any; to: any } | null {
  if (typeof value !== 'string') {
    return null;
  }

  const separator = value.includes('..') ? '..' : ',';
  const parts = value.split(separator);

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const from = parseInstant(parts[0]);
  const to = parseInstant(parts[1]);

  if (!from || !to) {
    return null;
  }

  if (Temporal.Instant.compare(from, to) > 0) {
    return null;
  }

  return { from, to };
}

async function findVisibleTask(
  taskId: string,
  user: AuthenticatedUser,
) {
  if (user.role === 'ADMIN') {
    return db.orm.public.Task
      .where({ id: taskId })
      .first();
  }

  if (user.role === 'PROJECT_MANAGER') {
    const projects = await db.orm.public.Project
      .where({ ownerId: user.id })
      .select('id')
      .all();

    const projectIds = projects.map((project) => project.id);

    return db.orm.public.Task
      .where({ id: taskId })
      .where((task) => task.projectId.in(projectIds))
      .first();
  }

  return db.orm.public.Task
    .where({
      id: taskId,
      assigneeId: user.id,
    })
    .first();
}

export async function listTasks(req: Request, res: Response) {
  try {
    const user = getCurrentUser(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    const {
      status,
      priority,
      dueDateRange: rangeValue,
    } = req.query;

    // Validate status filter
    if (
      status !== undefined &&
      (
        typeof status !== 'string' ||
        !TASK_STATUSES.includes(status as TaskStatus)
      )
    ) {
      return res.status(400).json({
        error: 'Invalid status filter',
      });
    }

    if (
      priority !== undefined &&
      (
        typeof priority !== 'string' ||
        !TASK_PRIORITIES.includes(priority as TaskPriority)
      )
    ) {
      return res.status(400).json({
        error: 'Invalid priority filter',
      });
    }

    const dateRange =
      rangeValue === undefined
        ? undefined
        : parseDueDateRange(rangeValue);

    if (rangeValue !== undefined && !dateRange) {
      return res.status(400).json({
        error:
          'dueDateRange must be two ISO timestamps separated by a comma or ..',
      });
    }

    let query = db.orm.public.Task;

    if (user.role === 'PROJECT_MANAGER') {
      const projects = await db.orm.public.Project
        .where({ ownerId: user.id })
        .select('id')
        .all();

      if (projects.length === 0) {
        return res.status(200).json({
          tasks: [],
        });
      }

      const projectIds = projects.map((project) => project.id);

      query = query.where((task) =>
        task.projectId.in(projectIds),
      );
    }

    if (user.role === 'DEVELOPER') {
      query = query.where({
        assigneeId: user.id,
      });
    }

    if (typeof status === 'string') {
      query = query.where({
        status: status as TaskStatus,
      });
    }

    if (typeof priority === 'string') {
      query = query.where({
        priority: priority as TaskPriority,
      });
    }

    if (dateRange) {
      query = query
        .where((task) => task.dueDate.gte(dateRange.from))
        .where((task) => task.dueDate.lte(dateRange.to));
    }

    const tasks = await query
      .orderBy((task) => task.dueDate.asc())
      .all();

    return res.status(200).json({
      tasks,
    });
  } catch {
    return res.status(500).json({
      error: 'Unable to list tasks',
    });
  }
}

export async function createTask(req: Request, res: Response) {
  try {
    const user = getCurrentUser(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    if (user.role === 'DEVELOPER') {
      return res.status(403).json({
        error: 'Only admins and project managers can create tasks',
      });
    }

    const {
      title,
      description,
      dueDate,
      projectId,
      assigneeId,
      priority = 'MEDIUM',
    } = req.body;

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      typeof projectId !== 'string' ||
      !projectId
    ) {
      return res.status(400).json({
        error: 'title and projectId are required',
      });
    }

    const parsedDueDate = parseInstant(dueDate);

    if (!parsedDueDate) {
      return res.status(400).json({
        error: 'dueDate must be an ISO timestamp',
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== 'string'
    ) {
      return res.status(400).json({
        error: 'description must be a string or null',
      });
    }

    if (
      assigneeId !== undefined &&
      assigneeId !== null &&
      typeof assigneeId !== 'string'
    ) {
      return res.status(400).json({
        error: 'assigneeId must be a string or null',
      });
    }

    if (
      typeof priority !== 'string' ||
      !TASK_PRIORITIES.includes(priority as TaskPriority)
    ) {
      return res.status(400).json({
        error: 'Invalid priority',
      });
    }

    const project =
      user.role === 'ADMIN'
        ? await db.orm.public.Project
            .where({ id: projectId })
            .first()
        : await db.orm.public.Project
            .where({
              id: projectId,
              ownerId: user.id,
            })
            .first();

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
      });
    }

    const task = await db.orm.public.Task.create({
      title: title.trim(),
      description: description?.trim() || null,
      dueDate: parsedDueDate,
      projectId,
      assigneeId: assigneeId ?? null,
      priority: priority as TaskPriority,
    });

    return res.status(201).json({
      task,
    });
  } catch {
    return res.status(500).json({
      error: 'Unable to create task',
    });
  }
}

export async function getTask(req: Request, res: Response) {
  try {
    const user = getCurrentUser(req);
    const taskId = getTaskId(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    if (!taskId) {
      return res.status(400).json({
        error: 'Invalid task id',
      });
    }

    const task = await findVisibleTask(taskId, user);

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    return res.status(200).json({
      task,
    });
  } catch {
    return res.status(500).json({
      error: 'Unable to get task',
    });
  }
}

export async function updateTaskStatus(
  req: Request,
  res: Response,
) {
  try {
    const user = getCurrentUser(req);
    const taskId = getTaskId(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    if (!taskId) {
      return res.status(400).json({
        error: 'Invalid task id',
      });
    }

    const { status } = req.body;

    if (
      typeof status !== 'string' ||
      !TASK_STATUSES.includes(status as TaskStatus)
    ) {
      return res.status(400).json({
        error: 'Invalid status',
      });
    }

    const existingTask = await findVisibleTask(taskId, user);

    if (!existingTask) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    const task = await db.orm.public.Task
      .where({ id: existingTask.id })
      .update({
        status: status as TaskStatus,
      });

    if (existingTask.status !== status) {
      await db.orm.public.ActivityLog.create({
        taskId: existingTask.id,
        userId: user.id,
        action: 'STATUS_CHANGED',
        oldValue: existingTask.status,
        newValue: status,
      });
    }

    return res.status(200).json({
      task,
    });
  } catch {
    return res.status(500).json({
      error: 'Unable to update task status',
    });
  }
}


export async function deleteTask(req: Request, res: Response) {
  try {
    const user = getCurrentUser(req);
    const taskId = getTaskId(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    // Developers cannot delete tasks.
    if (user.role === 'DEVELOPER') {
      return res.status(403).json({
        error: 'Only admins and project managers can delete tasks',
      });
    }

    if (!taskId) {
      return res.status(400).json({
        error: 'Invalid task id',
      });
    }

    const existingTask = await findVisibleTask(taskId, user);

    if (!existingTask) {
      return res.status(404).json({
        error: 'Task not found',
      });
    }

    await db.orm.public.Task
      .where({ id: existingTask.id })
      .delete();

    return res.status(204).send();
  } catch {
    return res.status(500).json({
      error: 'Unable to delete task',
    });
  }
}

