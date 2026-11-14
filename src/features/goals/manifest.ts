import Target from 'lucide-react';

export default {
  id: 'goals',
  name: 'Goals',
  path: '/goals',
  icon: Target,
  component: () => import('./GoalsDashboard'),
};