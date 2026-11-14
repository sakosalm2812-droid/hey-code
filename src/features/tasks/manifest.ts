/**
 * Tasks Feature Manifest
 *
 * Registers the Tasks feature with the FeatureRegistry.
 * Includes senses integration (voice, memory, permissions).
 */

import CheckSquare from 'lucide-react';
import type { EntityManifest } from '@/engines/entity/types';

const manifest: EntityManifest = {
  engine: 'entity',
  id: 'tasks',
  name: 'Tasks',
  path: '/tasks',
  icon: CheckSquare,
  component: () => import('./TasksDashboard'),
  entityType: 'task',
  integrations: {
    voice: true, // Enable voice commands
    memory: true, // Enable memory integration
    pinsThroughTrust: true, // Enable permission checks
  },
  permissions: {
    read: ['read:tasks'],
    write: ['write:tasks'],
    delete: ['delete:tasks'],
  },
};

export default manifest;
