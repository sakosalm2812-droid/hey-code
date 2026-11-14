/**
 * Tasks Feature Tests
 *
 * Comprehensive tests for the Tasks feature.
 * Tests store CRUD, derived selectors, and component rendering.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTasksStore, useTasks, useOverdueTasks, useTodayTasks, useCompletedCount } from '@/features/tasks/useTasksStore';
import type { Task, TaskStatus, TaskPriority } from '@/features/tasks/types';

// Helper to create a test task
function createTestTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `test-${Date.now()}`,
    title: 'Test Task',
    status: 'todo',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create a task with a specific due date
function createTaskWithDueDate(daysFromNow: number, status: TaskStatus = 'todo'): Task {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysFromNow);
  return createTestTask({
    dueDate: dueDate.toISOString(),
    status,
  });
}

describe('Tasks Store', () => {
  beforeEach(() => {
    // Clear the store before each test
    act(() => {
      const { result } = renderHook(() => useTasksStore());
      result.current.clear();
    });
  });

  afterEach(() => {
    // Clean up after each test
    act(() => {
      const { result } = renderHook(() => useTasksStore());
      result.current.clear();
    });
  });

  describe('CRUD Operations', () => {
    it('should add a task', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        const task = result.current.addTask({ title: 'Test Task' });
        expect(task).toBeDefined();
        expect(task.title).toBe('Test Task');
        expect(task.status).toBe('todo');
        expect(task.priority).toBe('medium');
      });

      expect(result.current.getAll().length).toBe(1);
    });

    it('should add multiple tasks', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.addMany([
          { title: 'Task 1' },
          { title: 'Task 2' },
          { title: 'Task 3' },
        ]);
      });

      expect(result.current.getAll().length).toBe(3);
    });

    it('should update a task', () => {
      const { result } = renderHook(() => useTasksStore());

      let taskId: string;
      act(() => {
        const task = result.current.addTask({ title: 'Test Task' });
        taskId = task.id;
      });

      act(() => {
        const updated = result.current.updateTask(taskId, {
          title: 'Updated Task',
          status: 'doing',
        });
        expect(updated).toBeDefined();
        expect(updated?.title).toBe('Updated Task');
        expect(updated?.status).toBe('doing');
      });

      const task = result.current.getById(taskId);
      expect(task?.title).toBe('Updated Task');
      expect(task?.status).toBe('doing');
    });

    it('should update multiple tasks', () => {
      const { result } = renderHook(() => useTasksStore());

      let taskIds: string[] = [];
      act(() => {
        const tasks = result.current.addMany([
          { title: 'Task 1' },
          { title: 'Task 2' },
          { title: 'Task 3' },
        ]);
        taskIds = tasks.map((t) => t.id);
      });

      act(() => {
        const updated = result.current.updateMany([taskIds[0], taskIds[1]], {
          status: 'doing',
        });
        expect(updated.length).toBe(2);
      });

      const tasks = result.current.getAll();
      expect(tasks.filter((t) => t.status === 'doing').length).toBe(2);
    });

    it('should remove a task', () => {
      const { result } = renderHook(() => useTasksStore());

      let taskId: string;
      act(() => {
        const task = result.current.addTask({ title: 'Test Task' });
        taskId = task.id;
      });

      expect(result.current.getAll().length).toBe(1);

      act(() => {
        const removed = result.current.removeTask(taskId);
        expect(removed).toBe(true);
      });

      expect(result.current.getAll().length).toBe(0);
    });

    it('should remove multiple tasks', () => {
      const { result } = renderHook(() => useTasksStore());

      let taskIds: string[];
      act(() => {
        const tasks = result.current.addMany([
          { title: 'Task 1' },
          { title: 'Task 2' },
          { title: 'Task 3' },
        ]);
        taskIds = tasks.map((t) => t.id);
      });

      expect(result.current.getAll().length).toBe(3);

      act(() => {
        const removedCount = result.current.removeMany([taskIds[0], taskIds[1]]);
        expect(removedCount).toBe(2);
      });

      expect(result.current.getAll().length).toBe(1);
    });

    it('should clear all tasks', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.addMany([
          { title: 'Task 1' },
          { title: 'Task 2' },
        ]);
      });

      expect(result.current.getAll().length).toBe(2);

      act(() => {
        result.current.clear();
      });

      expect(result.current.getAll().length).toBe(0);
    });

    it('should get task by ID', () => {
      const { result } = renderHook(() => useTasksStore());

      let taskId: string;
      act(() => {
        const task = result.current.addTask({ title: 'Test Task' });
        taskId = task.id;
      });

      const task = result.current.getById(taskId);
      expect(task).toBeDefined();
      expect(task?.title).toBe('Test Task');
    });

    it('should return undefined for non-existent task', () => {
      const { result } = renderHook(() => useTasksStore());

      const task = result.current.getById('non-existent');
      expect(task).toBeUndefined();
    });
  });

  describe('Status Management', () => {
    it('should toggle task completion', () => {
      const { result } = renderHook(() => useTasksStore());

      let taskId: string;
      act(() => {
        const task = result.current.addTask({ title: 'Test Task' });
        taskId = task.id;
      });

      // Initially not completed
      let task = result.current.getById(taskId);
      expect(task?.status).toBe('todo');

      // Toggle to completed
      act(() => {
        result.current.toggleComplete(taskId);
      });

      task = result.current.getById(taskId);
      expect(task?.status).toBe('done');

      // Toggle back to todo
      act(() => {
        result.current.toggleComplete(taskId);
      });

      task = result.current.getById(taskId);
      expect(task?.status).toBe('todo');
    });

    it('should set task status', () => {
      const { result } = renderHook(() => useTasksStore());

      let taskId: string;
      act(() => {
        const task = result.current.addTask({ title: 'Test Task' });
        taskId = task.id;
      });

      act(() => {
        result.current.setStatus(taskId, 'doing');
      });

      const task = result.current.getById(taskId);
      expect(task?.status).toBe('doing');
    });
  });

  describe('Derived Selectors', () => {
    it('should get tasks by status', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.addMany([
          { title: 'Todo Task', status: 'todo' },
          { title: 'Doing Task', status: 'doing' },
          { title: 'Done Task', status: 'done' },
          { title: 'Another Todo', status: 'todo' },
        ]);
      });

      const todoTasks = result.current.getByStatus('todo');
      expect(todoTasks.length).toBe(2);

      const doingTasks = result.current.getByStatus('doing');
      expect(doingTasks.length).toBe(1);

      const doneTasks = result.current.getByStatus('done');
      expect(doneTasks.length).toBe(1);
    });

    it('should get overdue tasks', () => {
      const { result } = renderHook(() => useTasksStore());

      // Create tasks with different due dates
      act(() => {
        result.current.addMany([
          createTaskWithDueDate(-1, 'todo'), // Overdue
          createTaskWithDueDate(1, 'todo'), // Future
          createTaskWithDueDate(-2, 'todo'), // Overdue
          createTaskWithDueDate(0, 'done'), // Today but done
        ]);
      });

      const overdueTasks = result.current.getOverdue();
      expect(overdueTasks.length).toBe(2);
    });

    it('should get today tasks', () => {
      const { result } = renderHook(() => useTasksStore());

      // Create tasks with different due dates
      act(() => {
        result.current.addMany([
          createTaskWithDueDate(0, 'todo'), // Today
          createTaskWithDueDate(1, 'todo'), // Tomorrow
          createTaskWithDueDate(-1, 'todo'), // Yesterday
          createTaskWithDueDate(0, 'done'), // Today but done
        ]);
      });

      const todayTasks = result.current.getToday();
      expect(todayTasks.length).toBe(1); // Only the todo task due today
    });

    it('should get tasks by priority', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.addMany([
          { title: 'High Priority', priority: 'high' },
          { title: 'Medium Priority', priority: 'medium' },
          { title: 'Low Priority', priority: 'low' },
          { title: 'Another High', priority: 'high' },
        ]);
      });

      const highPriorityTasks = result.current.getByPriority('high');
      expect(highPriorityTasks.length).toBe(2);

      const mediumPriorityTasks = result.current.getByPriority('medium');
      expect(mediumPriorityTasks.length).toBe(1);

      const lowPriorityTasks = result.current.getByPriority('low');
      expect(lowPriorityTasks.length).toBe(1);
    });

    it('should get tasks by project', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.addMany([
          { title: 'Project 1 Task', projectId: 'project-1' },
          { title: 'Project 2 Task', projectId: 'project-2' },
          { title: 'Another Project 1 Task', projectId: 'project-1' },
        ]);
      });

      const project1Tasks = result.current.getByProject('project-1');
      expect(project1Tasks.length).toBe(2);

      const project2Tasks = result.current.getByProject('project-2');
      expect(project2Tasks.length).toBe(1);
    });

    it('should get tasks by tag', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.addMany([
          { title: 'Tagged Task', tags: ['work', 'important'] },
          { title: 'Another Tagged Task', tags: ['work'] },
          { title: 'Different Tag', tags: ['personal'] },
        ]);
      });

      const workTasks = result.current.getByTag('work');
      expect(workTasks.length).toBe(2);

      const importantTasks = result.current.getByTag('important');
      expect(importantTasks.length).toBe(1);
    });

    it('should search tasks', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.addMany([
          { title: 'Design UI', description: 'Create the user interface' },
          { title: 'Develop API', description: 'Build the backend API' },
          { title: 'Test Features', description: 'Write unit tests' },
        ]);
      });

      const designTasks = result.current.search('design');
      expect(designTasks.length).toBe(1);

      const apiTasks = result.current.search('API');
      expect(apiTasks.length).toBe(1);

      const allTasks = result.current.search('');
      expect(allTasks.length).toBe(3);
    });

    it('should get completed count', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.addMany([
          { title: 'Task 1', status: 'todo' },
          { title: 'Task 2', status: 'doing' },
          { title: 'Task 3', status: 'done' },
          { title: 'Task 4', status: 'done' },
        ]);
      });

      expect(result.current.getCompletedCount()).toBe(2);
    });

    it('should get pending count', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.addMany([
          { title: 'Task 1', status: 'todo' },
          { title: 'Task 2', status: 'doing' },
          { title: 'Task 3', status: 'done' },
        ]);
      });

      expect(result.current.getPendingCount()).toBe(2);
    });
  });

  describe('Validation', () => {
    it('should require title', () => {
      const { result } = renderHook(() => useTasksStore());

      expect(() => {
        act(() => {
          result.current.addTask({ title: '' });
        });
      }).toThrow('Task title is required');
    });

    it('should validate title length', () => {
      const { result } = renderHook(() => useTasksStore());

      // This should work
      act(() => {
        result.current.addTask({ title: 'Valid title' });
      });

      // This should also work (300 chars max)
      const longTitle = 'a'.repeat(300);
      act(() => {
        result.current.addTask({ title: longTitle });
      });

      // But 301 chars should fail
      const tooLongTitle = 'a'.repeat(301);
      expect(() => {
        act(() => {
          result.current.addTask({ title: tooLongTitle });
        });
      }).toThrow();
    });
  });

  describe('Upsert', () => {
    it('should create new task on upsert', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        const task = result.current.upsert('new-id', { title: 'New Task' });
        expect(task.id).toBe('new-id');
        expect(task.title).toBe('New Task');
      });

      expect(result.current.getAll().length).toBe(1);
    });

    it('should update existing task on upsert', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.addTask({ title: 'Original Task' });
      });

      const task = result.current.getAll()[0];

      act(() => {
        const updated = result.current.upsert(task.id, { title: 'Updated Task' });
        expect(updated.title).toBe('Updated Task');
      });

      expect(result.current.getById(task.id)?.title).toBe('Updated Task');
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers on changes', () => {
      const { result } = renderHook(() => useTasksStore());
      const callback = vi.fn();

      act(() => {
        result.current.subscribe(callback);
      });

      act(() => {
        result.current.addTask({ title: 'Test Task' });
      });

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].length).toBe(1);
    });
  });
});

describe('Tasks Hooks', () => {
  beforeEach(() => {
    act(() => {
      const { result } = renderHook(() => useTasksStore());
      result.current.clear();
    });
  });

  it('should useTasks hook return all tasks', () => {
    const { result: storeResult } = renderHook(() => useTasksStore());

    act(() => {
      storeResult.current.addMany([
        { title: 'Task 1' },
        { title: 'Task 2' },
      ]);
    });

    const { result } = renderHook(() => useTasks());
    expect(result.current.length).toBe(2);
  });

  it('should useOverdueTasks hook return overdue tasks', () => {
    const { result: storeResult } = renderHook(() => useTasksStore());

    act(() => {
      storeResult.current.addMany([
        createTaskWithDueDate(-1, 'todo'),
        createTaskWithDueDate(1, 'todo'),
      ]);
    });

    const { result } = renderHook(() => useOverdueTasks());
    expect(result.current.length).toBe(1);
  });

  it('should useTodayTasks hook return today tasks', () => {
    const { result: storeResult } = renderHook(() => useTasksStore());

    act(() => {
      storeResult.current.addMany([
        createTaskWithDueDate(0, 'todo'),
        createTaskWithDueDate(1, 'todo'),
      ]);
    });

    const { result } = renderHook(() => useTodayTasks());
    expect(result.current.length).toBe(1);
  });

  it('should useCompletedCount hook return completed count', () => {
    const { result: storeResult } = renderHook(() => useTasksStore());

    act(() => {
      storeResult.current.addMany([
        { title: 'Task 1', status: 'todo' },
        { title: 'Task 2', status: 'done' },
        { title: 'Task 3', status: 'done' },
      ]);
    });

    const { result } = renderHook(() => useCompletedCount());
    expect(result.current).toBe(2);
  });
});
