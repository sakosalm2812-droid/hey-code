/**
 * Tasks Dashboard
 *
 * Full-featured Kanban board for task management.
 * GOLDEN feature with all required capabilities.
 * Uses HEY custom components.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springs } from '@/lib/heyMotion';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { TextInput as Input } from '@/components/ui/Input.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { AlertModal } from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/ui/Toast.jsx';
import { CheckSquare, Clock, Plus, Search, Filter, MoreVertical, Trash2, Edit2, X, AlertCircle, Calendar, Tag } from 'lucide-react';
import { useTasksStore, useTasks, useOverdueTasks, useTodayTasks, useCompletedCount, usePendingCount } from './useTasksStore';
import type { Task, TaskStatus, TaskPriority } from './types';

// Column configuration
const COLUMNS: { id: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'todo', label: 'Todo', icon: <Clock className="h-4 w-4" />, color: 'bg-blue-500' },
  { id: 'doing', label: 'Doing', icon: <CheckSquare className="h-4 w-4" />, color: 'bg-amber-500' },
  { id: 'done', label: 'Done', icon: <CheckSquare className="h-4 w-4" />, color: 'bg-green-500' },
];

// Priority options
const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-amber-600' },
  { value: 'high', label: 'High', color: 'text-red-600' },
];

// Animation variants
const dragItemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

// Priority badge component
const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const option = PRIORITY_OPTIONS.find((o) => o.value === priority) || PRIORITY_OPTIONS[1];
  return (
    <Badge variant="secondary" size="sm" className={option.color}>
      {option.label}
    </Badge>
  );
};

// Task card component
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onToggleComplete }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={dragItemVariants}
      layout
      className="relative p-4 rounded-lg bg-card border shadow-sm"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.status === 'done'}
          onChange={() => onToggleComplete(task)}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate flex-1">{task.title}</h4>
            <PriorityBadge priority={task.priority} />
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground truncate">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {task.dueDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.tags?.length > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {task.tags.join(', ')}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          aria-label="More actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Actions dropdown */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-full right-0 mt-1 w-40 rounded-md bg-popover shadow-lg border z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8"
              onClick={() => {
                onEdit(task);
                setShowActions(false);
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 text-destructive"
              onClick={() => {
                onDelete(task);
                setShowActions(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Column component
interface ColumnProps {
  column: { id: TaskStatus; label: string; icon: React.ReactNode; color: string };
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

const Column: React.FC<ColumnProps> = ({ column, tasks, onEdit, onDelete, onToggleComplete }) => {
  return (
    <Card padding="md" className="h-full min-h-[400px]">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${column.color}`} />
        <h3 className="font-semibold text-foreground">{column.label}</h3>
        <Badge variant="secondary" size="sm">{tasks.length}</Badge>
      </div>

      <div className="flex-1 space-y-3">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground text-sm"
          >
            No tasks
          </motion.div>
        )}
      </div>
    </Card>
  );
};

// Task form component
interface TaskFormProps {
  task?: Task | null;
  onSubmit: (data: Partial<Task>) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate || '',
    tags: task?.tags || [],
    projectId: task?.projectId || '',
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 300) {
      newErrors.title = 'Title must be 300 characters or less';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be 2000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Task title"
          autoFocus
          error={errors.title}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Task description (optional)"
          error={errors.description}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Status</label>
          <Select
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
            options={COLUMNS.map((col) => ({ value: col.id, label: col.label }))}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Priority</label>
          <Select
            value={formData.priority}
            onChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
            options={PRIORITY_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Due Date</label>
        <Input
          type="datetime-local"
          value={formData.dueDate || ''}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Tags</label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tag"
          />
          <Button type="button" size="sm" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        {formData.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" size="sm" removable onRemove={() => handleRemoveTag(tag)}>
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

// Main Tasks Dashboard Component
const TasksDashboard: React.FC = () => {
  const { show: showToast } = useToast();
  const tasks = useTasks();
  const overdueCount = useOverdueTasks().length;
  const todayCount = useTodayTasks().length;
  const completedCount = useCompletedCount();
  const pendingCount = usePendingCount();

  const {
    addTask,
    updateTask,
    removeTask,
    toggleComplete,
    setStatus,
    search: searchTasks,
  } = useTasksStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Filtered tasks
  const filteredTasks = React.useMemo(() => {
    let result = tasks;

    // Apply search filter
    if (searchQuery.trim()) {
      result = searchTasks(searchQuery);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    return result;
  }, [tasks, searchQuery, priorityFilter, searchTasks]);

  // Group tasks by status
  const tasksByStatus: Record<TaskStatus, Task[]> = React.useMemo(() => {
    return {
      todo: filteredTasks.filter((t) => t.status === 'todo'),
      doing: filteredTasks.filter((t) => t.status === 'doing'),
      done: filteredTasks.filter((t) => t.status === 'done'),
    };
  }, [filteredTasks]);

  // Handle create task
  const handleCreateTask = useCallback((data: Partial<Task>) => {
    try {
      const task = addTask({
        title: data.title || '',
        description: data.description,
        status: data.status as TaskStatus || 'todo',
        priority: data.priority as TaskPriority || 'medium',
        dueDate: data.dueDate || undefined,
        tags: data.tags || [],
        projectId: data.projectId,
      });

      showToast(`"${task.title}" has been created`, { type: 'success' });
      setShowCreateDialog(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create task', { type: 'error' });
    }
  }, [addTask, showToast]);

  // Handle update task
  const handleUpdateTask = useCallback((data: Partial<Task>) => {
    if (!editingTask) return;

    try {
      const updated = updateTask(editingTask.id, data);
      if (updated) {
        showToast(`"${updated.title}" has been updated`, { type: 'success' });
        setEditingTask(null);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update task', { type: 'error' });
    }
  }, [editingTask, updateTask, showToast]);

  // Handle delete task
  const handleDeleteTask = useCallback(() => {
    if (!deletingTask) return;

    try {
      const deleted = removeTask(deletingTask.id);
      if (deleted) {
        showToast(`"${deletingTask.title}" has been deleted`, { type: 'success' });
      }
      setDeletingTask(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete task', { type: 'error' });
    }
  }, [deletingTask, removeTask, showToast]);

  // Handle toggle complete
  const handleToggleComplete = useCallback((task: Task) => {
    const updated = toggleComplete(task.id);
    if (updated) {
      showToast(`"${updated.title}" is now ${updated.status}`, { type: 'success' });
    }
  }, [toggleComplete, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open create dialog
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCreateDialog(true);
      }

      // Escape to close dialogs
      if (e.key === 'Escape') {
        if (showCreateDialog) setShowCreateDialog(false);
        if (editingTask) setEditingTask(null);
        if (deletingTask) setDeletingTask(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateDialog, editingTask, deletingTask]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="max-w-7xl mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Kanban board for managing your tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateDialog(true)} size="md">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold">{completedCount}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold">{todayCount}</div>
            <div className="text-sm text-muted-foreground">Due Today</div>
          </div>
        </Card>
        <Card padding="md">
          <div className="text-center">
            <div className="text-2xl font-bold">{overdueCount}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Priority:</span>
            <Select
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}
              options={[
                { value: 'all', label: 'All' },
                ...PRIORITY_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
              ]}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setPriorityFilter('all');
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id]}
            onEdit={setEditingTask}
            onDelete={setDeletingTask}
            onToggleComplete={handleToggleComplete}
          />
        ))}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first task
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Modal
        open={showCreateDialog || !!editingTask}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create Task'}
        description={editingTask ? `Edit "${editingTask.title}"` : 'Add a new task to your board'}
      >
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={() => {
            setShowCreateDialog(false);
            setEditingTask(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertModal
        open={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        title="Are you sure?"
        message={`This will permanently delete "${deletingTask?.title}". This action cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDeleteTask}
      />
    </motion.div>
  );
};

export default TasksDashboard;
