import { prisma } from '@/lib/prisma';

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface TaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  tags?: string[];
  sortOrder?: number;
}

export function priorityRank(priority: string): number {
  const index = TASK_PRIORITIES.indexOf(priority as TaskPriority);
  return index === -1 ? 1 : index;
}

export function isOverdue(task: { status: string; dueDate: Date | string | null }, now = new Date()): boolean {
  if (task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
  if (!task.dueDate) return false;
  const due = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate;
  return due.getTime() < now.getTime();
}

export function sortByPriority<T extends { priority: string }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || (a.priority as string).localeCompare(b.priority as string));
}

export function filterTasks<T extends { status: string; title: string }>(
  tasks: T[],
  filter: { status?: string; search?: string }
): T[] {
  let result = tasks;
  if (filter.status && filter.status !== 'ALL') {
    result = result.filter((t) => t.status === filter.status);
  }
  if (filter.search?.trim()) {
    const term = filter.search.trim().toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(term));
  }
  return result;
}

export function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function summarizeDay(tasks: { status: string; priority: string }[]): { completed: number; pending: number; focus: number } {
  return {
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    pending: tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length,
    focus: tasks.filter((t) => (t.priority === 'HIGH' || t.priority === 'URGENT') && t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length,
  };
}

export function toIcs(tasks: { title: string; description?: string | null; dueDate?: Date | string | null; completedAt?: Date | string | null; id: string }[]): string {
  const nowStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HEY//Tasks//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const due = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate;
    const dtend = new Date(due.getTime() + 60 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${task.id}@hey`,
      `DTSTAMP:${nowStamp(new Date())}`,
      `DTSTART:${nowStamp(due)}`,
      `DTEND:${nowStamp(dtend)}`,
      `SUMMARY:${task.title.replace(/[;,]\s*/g, ' ')}`,
      ...(task.description ? [`DESCRIPTION:${task.description.replace(/[;,]\s*/g, ' ')}`] : []),
      `STATUS:${task.completedAt ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export async function createTask(userId: string, input: TaskInput) {
  const title = (input.title || '').trim();
  if (!title) throw new Error('Task title is required');

  let dueDate: Date | null = null;
  if (input.dueDate) {
    dueDate = new Date(input.dueDate);
    if (Number.isNaN(dueDate.getTime())) throw new Error('Invalid due date');
  }

  return prisma.task.create({
    data: {
      userId,
      title: title.slice(0, 300),
      description: input.description?.slice(0, 2000),
      priority: input.priority ?? 'MEDIUM',
      dueDate,
      tags: input.tags?.slice(0, 20) ?? [],
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function listTasks(
  userId: string,
  filter?: { status?: string; priority?: string; due?: string; search?: string; includeCompleted?: boolean }
) {
  const where: Record<string, any> = { userId };

  if (filter?.status && filter.status !== 'ALL') {
    where.status = filter.status;
  }
  if (filter?.priority && filter.priority !== 'ALL') {
    where.priority = filter.priority;
  }
  if (!filter?.includeCompleted) {
    where.status = where.status ?? { not: 'CANCELLED' };
  }
  if (filter?.due === 'today') {
    where.dueDate = { gte: startOfDay(), lte: endOfDay() };
  } else if (filter?.due === 'overdue') {
    where.dueDate = { lt: new Date() };
    where.status = where.status && where.status !== 'CANCELLED' ? where.status : { not: 'COMPLETED' };
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const searched = filter?.search?.trim() ? filterTasks(tasks as any, { search: filter.search }) : tasks;
  return sortByPriority(searched as any);
}

export async function getTaskById(userId: string, taskId: string) {
  return prisma.task.findFirst({ where: { id: taskId, userId } });
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: Partial<{ title: string; description: string; priority: TaskPriority; status: TaskStatus; dueDate: string | null; tags: string[] }>
) {
  const existing = await getTaskById(userId, taskId);
  if (!existing) return null;

  const patch: Record<string, any> = {};
  if (data.title?.trim()) patch.title = data.title.trim().slice(0, 300);
  if (data.description !== undefined) patch.description = data.description.slice(0, 2000);
  if (data.priority) patch.priority = data.priority;
  if (data.tags) patch.tags = data.tags.slice(0, 20);
  if (data.dueDate !== undefined) {
    patch.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }
  if (data.status) {
    patch.status = data.status;
    if (data.status === 'COMPLETED') patch.completedAt = new Date();
    if (data.status !== 'COMPLETED') patch.completedAt = null;
  }

  return prisma.task.update({ where: { id: taskId }, data: patch });
}

export async function completeTask(userId: string, taskId: string) {
  return updateTask(userId, taskId, { status: 'COMPLETED' });
}

export async function deleteTask(userId: string, taskId: string) {
  return prisma.task.deleteMany({ where: { id: taskId, userId } });
}

export async function getPlanner(userId: string, date = new Date()) {
  const from = startOfDay(date);
  const to = endOfDay(date);

  const [dueToday, overdue, recentCompleted] = await Promise.all([
    prisma.task.findMany({
      where: { userId, status: { notIn: ['COMPLETED', 'CANCELLED'] }, dueDate: { gte: from, lte: to } },
      orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }],
    }),
    prisma.task.findMany({
      where: { userId, status: { notIn: ['COMPLETED', 'CANCELLED'] }, dueDate: { lt: new Date() } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.task.findMany({
      where: { userId, status: 'COMPLETED', updatedAt: { gte: from } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
  ]);

  const dueTodaySorted = sortByPriority(dueToday as any) as any[];
  const summary = summarizeDay([...dueToday, ...overdue, ...recentCompleted]);

  return {
    date: from.toISOString(),
    dueToday: dueTodaySorted,
    overdue: sortByPriority(overdue as any) as any[],
    completedToday: recentCompleted,
    summary,
  };
}