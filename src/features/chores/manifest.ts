import CheckSquare from 'lucide-react';

export default {
  id: 'chores',
  name: 'Chores',
  path: '/chores',
  icon: CheckSquare,
  component: () => import('./ChoresDashboard'),
};