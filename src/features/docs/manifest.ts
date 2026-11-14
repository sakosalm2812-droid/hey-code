import BookOpen from 'lucide-react';

export default {
  id: 'docs',
  name: 'Docs',
  path: '/docs',
  icon: BookOpen,
  component: () => import('./DocsDashboard'),
};