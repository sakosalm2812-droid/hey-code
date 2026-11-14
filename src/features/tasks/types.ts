/**
 * Tasks Feature Types
 *
 * Defines the Task entity type for the Entity Engine.
 */

import type { BaseEntity } from '@/engines/entity/types';

// Task status types
export type TaskStatus = 'todo' | 'doing' | 'done';

// Task priority types
export type TaskPriority = 'low' | 'medium' | 'high';

// Task entity interface
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  tags?: string[];
  projectId?: string;
  sortOrder?: number;
  completedAt?: string | null;
}

// Task input for creation (without auto-generated fields)
export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>;

// Task input for updates (all fields optional)
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;

// Task filter options
export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: 'today' | 'overdue' | 'this-week' | string;
  search?: string;
  projectId?: string;
  tags?: string[];
}

// Task query result
export interface TaskQueryResult {
  tasks: Task[];
  total: number;
  hasMore: boolean;
}

// Derived task selectors
export interface TaskSelectors {
  getByStatus: (status: TaskStatus) => Task[];
  getOverdue: () => Task[];
  getToday: () => Task[];
  getByPriority: (priority: TaskPriority) => Task[];
  getByProject: (projectId: string) => Task[];
  getByTag: (tag: string) => Task[];
  search: (query: string) => Task[];
}

// Validation function for tasks
export function validateTask(task: Task): boolean {
  if (!task.title || task.title.trim().length === 0) {
    return false;
  }
  if (task.title.length > 300) {
    return false;
  }
  if (task.description && task.description.length > 2000) {
    return false;
  }
  if (task.tags && task.tags.length > 20) {
    return false;
  }
  if (task.status && !['todo', 'doing', 'done'].includes(task.status)) {
    return false;
  }
  if (task.priority && !['low', 'medium', 'high'].includes(task.priority)) {
    return false;
  }
  return true;
}

// Helper to check if task is overdue
export function isOverdue(task: Task): boolean {
  if (task.status === 'done') return false;
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const now = new Date();
  return due.getTime() < now.getTime();
}

// Helper to check if task is due today
export function isDueToday(task: Task): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate.getTime() === today.getTime();
}

// Helper to get start of day
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to get end of day
export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
