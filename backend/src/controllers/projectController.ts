import type { Request, Response } from "express";
import { db } from "../prisma/db";

type UserRole = "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";

function getUser(req: Request): { id: string; role: UserRole } | null {
  const { sub: id, role } = req.user as any;
  if (!id || !role) return null;
  return { id, role };
}


async function getVisibleProject(id: string, user: { id: string; role: UserRole }) {
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
    const user = getUser(req);
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
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role === "DEVELOPER") {
      return res.status(403).json({ error: "Devs can't create projects" });
    }

    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

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
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const id = req.params.id;
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
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role === "DEVELOPER") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const existing = await getVisibleProject(id, user);
    if (!existing) return res.status(404).json({ error: "Not found" });

    const { name, description } = req.body;
    const data: any = {};
    
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;

    const project = await db.orm.public.Project.where({ id: existing.id }).update(data);
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function deleteProject(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role === "DEVELOPER") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Invalid ID" });

    const existing = await getVisibleProject(id, user);
    if (!existing) return res.status(404).json({ error: "Not found" });

    await db.orm.public.Project.where({ id: existing.id }).delete();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}