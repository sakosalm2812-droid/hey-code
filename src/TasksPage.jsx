/**
 * Tasks Page
 *
 * Main page for the Tasks feature.
 * Uses the GOLDEN TasksDashboard from features/tasks.
 */

import { Suspense } from 'react';
import TasksDashboard from './features/tasks/TasksDashboard';

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksDashboard />
    </Suspense>
  );
}
