import type { Request, Response } from "express";
import { db } from "../prisma/db";
import { getAuthenticatedUser, type AuthenticatedUser } from '../middlerware/authMiddleware';

function getProjectId(req: Request): string | null {
  const id = req.params.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

async function getVisibleProject(id: string, user: AuthenticatedUser) {
  if (user.role === "ADMIN") {
    return db.orm.public.Project.where({ id }).first();
  }
  if (user.role === "PROJECT_MANAGER") {
    return db.orm.public.Project.where({ id, ownerId: user.id }).first();
  }
  return db.orm.public.Project.where({ id })
    .where((p) => p.tasks.some((t) => t.assigneeId.eq(user.id)))
    .first();
}

export async function listProjects(req: Request, res: Response) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let projects;
    if (user.role === "ADMIN") {
      projects = await db.orm.public.Project.orderBy((p) => p.createdAt.desc()).all();
    } else if (user.role === "PROJECT_MANAGER") {
      projects = await db.orm.public.Project.where({ ownerId: user.id })
        .orderBy((p) => p.createdAt.desc())
        .all();
    } else {
      projects = await db.orm.public.Project.where((p) =>
        p.tasks.some((t) => t.assigneeId.eq(user.id)),
      )
        .orderBy((p) => p.createdAt.desc())
        .all();
    }

    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function createProject(req: Request, res: Response) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { name, description } = req.body as { name?: unknown; description?: unknown };
    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: "Name is required" });
    if (description !== undefined && description !== null && typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be a string' });
    }

    const project = await db.orm.public.Project.create({
      name: name.trim(),
      description: description?.trim() || null,
      ownerId: user.id,
    });

    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getProject(req: Request, res: Response) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const id = getProjectId(req);
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const project = await getVisibleProject(id, user);
    if (!project) return res.status(404).json({ error: "Not found" });

    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function updateProject(req: Request, res: Response) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const id = getProjectId(req);
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const existing = await getVisibleProject(id, user);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const { name, description } = req.body as { name?: unknown; description?: unknown };
    const data: { name?: string; description?: string | null } = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Name must be a non-empty string' });
      data.name = name.trim();
    }
    if (description !== undefined) {
      if (description !== null && typeof description !== 'string') return res.status(400).json({ error: 'Description must be a string or null' });
      data.description = description?.trim() || null;
    }

    const project = await db.orm.public.Project.where({ id: existing.id }).update(data);
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function deleteProject(req: Request, res: Response) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const id = getProjectId(req);
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const existing = await getVisibleProject(id, user);
    if (!existing) return res.status(404).json({ error: "Not found" });

    await db.orm.public.Project.where({ id: existing.id }).delete();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}
