# Entity Engine

**Engine 1: Entity Engine** - Powers 400+ features with generic entity management.

## Purpose
Provides a unified interface for managing entities (tasks, notes, contacts, etc.) with:
- CRUD operations
- State management (Zustand integration)
- Database persistence (Supabase/Prisma)
- Senses integration (voice, memory, permissions)
- Auto-discovery for features

## Architecture
- **EntityStore**: Generic Zustand store factory for any entity type
- **EntityRepository**: Database operations for entities
- **EntityService**: Business logic layer
- **EntityManifest**: Feature registration

## Usage
```typescript
// Define your entity type
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  // ...
}

// Create a store
const useTasksStore = createEntityStore<Task>('tasks', {
  persistKey: 'hey-tasks',
  defaultEntity: { status: 'todo' },
});

// Use in components
const { entities, add, update, remove } = useTasksStore();
```
