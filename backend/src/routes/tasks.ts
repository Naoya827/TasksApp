import { Router } from "express";
import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

const VALID_STATUSES = new Set<string>(Object.values(TaskStatus));
const VALID_PRIORITIES = new Set<string>(Object.values(TaskPriority));

router.get("/", async (req, res) => {
  const { status, search, date, tag } = req.query as {
    status?: string;
    search?: string;
    date?: string;
    tag?: string;
  };

  const where: Prisma.TaskWhereInput = {};

  if (status) {
    if (!VALID_STATUSES.has(status)) {
      res.status(400).json({ error: "無効なステータスです" });
      return;
    }
    where.status = status as TaskStatus;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (date) {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      res.status(400).json({ error: "無効な日付形式です" });
      return;
    }
    const start = new Date(parsed);
    start.setHours(0, 0, 0, 0);
    const end = new Date(parsed);
    end.setHours(23, 59, 59, 999);
    where.dueDate = { gte: start, lte: end };
  }

  if (tag) {
    where.tags = { has: tag };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { assignee: { select: { id: true, name: true } } },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  res.json(tasks);
});

router.post("/", async (req, res) => {
  const { title, description, priority, due_date, tags } = req.body as {
    title?: string;
    description?: string;
    priority?: string;
    due_date?: string | null;
    tags?: string[];
  };

  if (!title?.trim()) {
    res.status(400).json({ error: "タイトルは必須です" });
    return;
  }

  if (priority && !VALID_PRIORITIES.has(priority)) {
    res.status(400).json({ error: "無効な優先度です" });
    return;
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      priority: (priority as TaskPriority) || TaskPriority.MIDDLE,
      dueDate: due_date ? new Date(due_date) : null,
      tags: tags || [],
      status: TaskStatus.INBOX,
      assigneeId: null,
    },
    include: { assignee: { select: { id: true, name: true } } },
  });

  res.status(201).json(task);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status, assignee_id, title, description, priority, due_date, tags } =
    req.body as {
      status?: string;
      assignee_id?: string | null;
      title?: string;
      description?: string | null;
      priority?: string;
      due_date?: string | null;
      tags?: string[];
    };

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "タスクが見つかりません" });
    return;
  }

  if (status && !VALID_STATUSES.has(status)) {
    res.status(400).json({ error: "無効なステータスです" });
    return;
  }

  if (priority && !VALID_PRIORITIES.has(priority)) {
    res.status(400).json({ error: "無効な優先度です" });
    return;
  }

  if (assignee_id) {
    const user = await prisma.user.findUnique({ where: { id: assignee_id } });
    if (!user) {
      res.status(400).json({ error: "担当者が見つかりません" });
      return;
    }
  }

  const data: Prisma.TaskUpdateInput = {};

  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (priority !== undefined) data.priority = priority as TaskPriority;
  if (due_date !== undefined) data.dueDate = due_date ? new Date(due_date) : null;
  if (tags !== undefined) data.tags = tags;

  if (status !== undefined) {
    data.status = status as TaskStatus;
    if (status === TaskStatus.INBOX) {
      data.assignee = { disconnect: true };
    }
  }

  if (assignee_id !== undefined) {
    if (assignee_id === null) {
      data.assignee = { disconnect: true };
    } else {
      data.assignee = { connect: { id: assignee_id } };
      if (!status) {
        data.status = TaskStatus.ASSIGNED;
      }
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { assignee: { select: { id: true, name: true } } },
  });

  res.json(task);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "タスクが見つかりません" });
    return;
  }

  await prisma.task.delete({ where: { id } });
  res.status(204).send();
});

export default router;
