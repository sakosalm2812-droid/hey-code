import Bug from 'lucide-react';

export default {
  id: 'bugs',
  name: 'Bugs',
  path: '/bugs',
  icon: Bug,
  component: () => import('./BugsDashboard'),
};