import GitBranch from 'lucide-react';

export default {
  id: 'git',
  name: 'Git',
  path: '/git',
  icon: GitBranch,
  component: () => import('./GitDashboard'),
};