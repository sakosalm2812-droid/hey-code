import CheckSquare from 'lucide-react';

export default {
  id: 'habits',
  name: 'Habits',
  path: '/habits',
  icon: CheckSquare,
  component: () => import('./HabitsDashboard'),
};