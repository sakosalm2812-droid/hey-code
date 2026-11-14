/**
 * Tasks Store
 *
 * Zustand store for tasks using the Entity Engine.
 * Provides full CRUD operations, derived selectors, and persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput } from './types';
import { validateTask, isOverdue, isDueToday } from './types';

// Store state interface
interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  lastUpdated: string;
}

// Store actions interface
interface TasksActions {
  // Core CRUD
  addTask: (data: CreateTaskInput) => Task;
  updateTask: (id: string, data: UpdateTaskInput) => Task | undefined;
  removeTask: (id: string) => boolean;
  getAll: () => Task[];
  getById: (id: string) => Task | undefined;

  // Status management
  toggleComplete: (id: string) => Task | undefined;
  setStatus: (id: string, status: TaskStatus) => Task | undefined;

  // Bulk operations
  addMany: (tasks: CreateTaskInput[]) => Task[];
  updateMany: (ids: string[], data: UpdateTaskInput) => Task[];
  removeMany: (ids: string[]) => number;
  clear: () => void;

  // Derived selectors
  getByStatus: (status: TaskStatus) => Task[];
  getOverdue: () => Task[];
  getToday: () => Task[];
  getByPriority: (priority: TaskPriority) => Task[];
  getByProject: (projectId: string) => Task[];
  getByTag: (tag: string) => Task[];
  search: (query: string) => Task[];
  getCompletedCount: () => number;
  getPendingCount: () => number;

  // State management
  setTasks: (tasks: Task[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;

  // Subscriptions
  subscribe: (callback: (tasks: Task[]) => void) => () => void;
}

// Combined store type
type TasksStore = TasksState & TasksActions;

// Default task values
const DEFAULT_TASK: Partial<Task> = {
  status: 'todo',
  priority: 'medium',
  tags: [],
  sortOrder: 0,
};

/**
 * Create a task with defaults
 */
function createTask(data: CreateTaskInput): Task {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    ...DEFAULT_TASK,
    ...data,
  };
}

/**
 * Update a task with new data
 */
function updateTaskEntity(task: Task, data: UpdateTaskInput): Task {
  const updated: Task = {
    ...task,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // Handle status changes
  if (data.status === 'done' && !task.completedAt) {
    updated.completedAt = new Date().toISOString();
  } else if (data.status !== 'done') {
    updated.completedAt = null;
  }

  return updated;
}

// Create the store
export const useTasksStore = create<TasksStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        tasks: [],
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),

        // Core CRUD
        addTask: (data: CreateTaskInput) => {
          if (!data.title || data.title.trim().length === 0) {
            throw new Error('Task title is required');
          }

          const task = createTask(data);

          if (!validateTask(task)) {
            throw new Error('Invalid task data');
          }

          set((state) => ({
            tasks: [...state.tasks, task],
            lastUpdated: new Date().toISOString(),
          }));

          return task;
        },

        updateTask: (id: string, data: UpdateTaskInput) => {
          const task = get().tasks.find((t) => t.id === id);
          if (!task) return undefined;

          const updated = updateTaskEntity(task, data);

          if (!validateTask(updated)) {
            throw new Error('Invalid task data');
          }

          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
            lastUpdated: new Date().toISOString(),
          }));

          return updated;
        },

        removeTask: (id: string) => {
          const exists = get().tasks.some((t) => t.id === id);
          if (exists) {
            set((state) => ({
              tasks: state.tasks.filter((t) => t.id !== id),
              lastUpdated: new Date().toISOString(),
            }));
          }
          return exists;
        },

        getAll: () => get().tasks,

        getById: (id: string) => get().tasks.find((t) => t.id === id),

        // Status management
        toggleComplete: (id: string) => {
          const task = get().tasks.find((t) => t.id === id);
          if (!task) return undefined;

          const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
          return get().setStatus(id, newStatus);
        },

        setStatus: (id: string, status: TaskStatus) => {
          return get().updateTask(id, { status });
        },

        // Bulk operations
        addMany: (tasks: CreateTaskInput[]) => {
          const newTasks = tasks.map((data) => {
            if (!data.title || data.title.trim().length === 0) {
              throw new Error('Task title is required');
            }
            return createTask(data);
          });

          // Validate all
          for (const task of newTasks) {
            if (!validateTask(task)) {
              throw new Error('Invalid task data');
            }
          }

          set((state) => ({
            tasks: [...state.tasks, ...newTasks],
            lastUpdated: new Date().toISOString(),
          }));

          return newTasks;
        },

        updateMany: (ids: string[], data: UpdateTaskInput) => {
          const updatedTasks: Task[] = [];
          const idSet = new Set(ids);

          set((state) => {
            const newTasks = state.tasks.map((t) => {
              if (idSet.has(t.id)) {
                const updated = updateTaskEntity(t, data);
                if (!validateTask(updated)) {
                  throw new Error('Invalid task data');
                }
                updatedTasks.push(updated);
                return updated;
              }
              return t;
            });
            return {
              tasks: newTasks,
              lastUpdated: new Date().toISOString(),
            };
          });

          return updatedTasks;
        },

        removeMany: (ids: string[]) => {
          const idSet = new Set(ids);
          const initialCount = get().tasks.length;

          set((state) => ({
            tasks: state.tasks.filter((t) => !idSet.has(t.id)),
            lastUpdated: new Date().toISOString(),
          }));

          return initialCount - get().tasks.length;
        },

        clear: () => {
          set({
            tasks: [],
            lastUpdated: new Date().toISOString(),
          });
        },

        // Derived selectors
        getByStatus: (status: TaskStatus) => {
          return get().tasks.filter((t) => t.status === status);
        },

        getOverdue: () => {
          return get().tasks.filter(isOverdue);
        },

        getToday: () => {
          return get().tasks.filter(isDueToday);
        },

        getByPriority: (priority: TaskPriority) => {
          return get().tasks.filter((t) => t.priority === priority);
        },

        getByProject: (projectId: string) => {
          return get().tasks.filter((t) => t.projectId === projectId);
        },

        getByTag: (tag: string) => {
          return get().tasks.filter((t) => t.tags?.includes(tag));
        },

        search: (query: string) => {
          const lowerQuery = query.toLowerCase().trim();
          if (!lowerQuery) return get().tasks;

          return get().tasks.filter(
            (t) =>
              t.title.toLowerCase().includes(lowerQuery) ||
              (t.description?.toLowerCase().includes(lowerQuery) ?? false) ||
              (t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)) ?? false)
          );
        },

        getCompletedCount: () => {
          return get().tasks.filter((t) => t.status === 'done').length;
        },

        getPendingCount: () => {
          return get().tasks.filter((t) => t.status !== 'done').length;
        },

        // State management
        setTasks: (tasks: Task[]) => {
          set({
            tasks,
            loading: false,
            error: null,
            lastUpdated: new Date().toISOString(),
          });
        },

        setLoading: (loading: boolean) => {
          set({ loading });
        },

        setError: (error: Error | null) => {
          set({ error, loading: false });
        },

        // Subscriptions
        subscribe: (callback: (tasks: Task[]) => void) => {
          return useTasksStore.subscribe(
            (state) => state.tasks,
            (tasks) => callback(tasks)
          );
        },
      }),
      {
        name: 'hey-tasks',
        partialize: (state) => ({
          tasks: state.tasks,
          lastUpdated: state.lastUpdated,
        }),
      }
    ),
    { name: 'tasks-store' }
  )
);

// Selector hooks for better performance
export const useTasks = () => useTasksStore((state) => state.tasks);
export const useLoading = () => useTasksStore((state) => state.loading);
export const useError = () => useTasksStore((state) => state.error);
export const useTasksByStatus = (status: TaskStatus) =>
  useTasksStore((state) => state.tasks.filter((t) => t.status === status));
export const useOverdueTasks = () =>
  useTasksStore((state) => state.tasks.filter(isOverdue));
export const useTodayTasks = () =>
  useTasksStore((state) => state.tasks.filter(isDueToday));
export const useCompletedCount = () =>
  useTasksStore((state) => state.tasks.filter((t) => t.status === 'done').length);
export const usePendingCount = () =>
  useTasksStore((state) => state.tasks.filter((t) => t.status !== 'done').length);

// Export the store and types
export type { Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput };
export default useTasksStore;
