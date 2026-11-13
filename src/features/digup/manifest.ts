// src/features/digup/manifest.ts
// Digup Feature Manifest — registers Digup with the FeatureRegistry.

import type { FeatureManifest } from '@/core/registry/FeatureRegistry';
import { Zap } from 'lucide-react';

const manifest: FeatureManifest = {
  id: 'digup',
  name: 'Digup',
  path: '/digup',
  icon: Zap,
  component: () => import('@/engines/digup/DigupDashboard'),
  integrations: {
    voice: true, // Voice search via MCP
    memory: true, // Search queries stored in Cosmos
    pinsThroughTrust: true, // Permission checks for file access
  },
  permissions: {
    read: ['digup:search', 'digup:status'],
    write: ['digup:index'],
    admin: ['digup:configure'],
  },
};

export default manifest;