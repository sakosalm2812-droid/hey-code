-- Tasks Table Migration
-- Created for Entity Engine - Engine 1
-- Powers Tasks feature and 400+ other features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User association (for multi-tenancy)
  user_id UUID NOT NULL,

  -- Core task fields
  title TEXT NOT NULL CHECK (LENGTH(title) > 0 AND LENGTH(title) <= 300),
  description TEXT CHECK (LENGTH(description) <= 2000),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),

  -- Priority
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Due date
  due_date TIMESTAMPTZ,

  -- Tags (array of strings)
  tags TEXT[] DEFAULT '{}',

  -- Project association
  project_id UUID,

  -- Sort order for manual ordering
  sort_order INTEGER DEFAULT 0,

  -- Completion tracking
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS

-- Users can select their own tasks
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tasks
CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance

-- Primary index on user_id for fast user queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Index on priority for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Index on due_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Composite index for common query patterns (user + status + created_at)
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_created ON tasks(user_id, status, created_at DESC);

-- Composite index for project queries
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status, created_at DESC);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for overdue tasks
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT * FROM tasks
WHERE status != 'done'
  AND due_date IS NOT NULL
  AND due_date < NOW();

-- Create a view for today's tasks
CREATE OR REPLACE VIEW today_tasks AS
SELECT * FROM tasks
WHERE status != 'done'
  AND due_date IS NOT NULL
  AND due_date::date = CURRENT_DATE;

-- Add comments for documentation
COMMENT ON TABLE tasks IS 'Tasks table for the Entity Engine - stores user tasks with full CRUD and RLS support';
COMMENT ON COLUMN tasks.user_id IS 'Foreign key to auth.users - owner of the task';
COMMENT ON COLUMN tasks.title IS 'Task title (required, max 300 chars)';
COMMENT ON COLUMN tasks.status IS 'Task status: todo, doing, or done';
COMMENT ON COLUMN tasks.priority IS 'Task priority: low, medium, or high';
COMMENT ON COLUMN tasks.due_date IS 'Due date for the task (nullable)';
COMMENT ON COLUMN tasks.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN tasks.project_id IS 'Optional foreign key to projects table';
