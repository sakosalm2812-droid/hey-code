import Activity from 'lucide-react';

export default {
  id: 'fitness',
  name: 'Fitness',
  path: '/fitness',
  icon: Activity,
  component: () => import('./FitnessDashboard'),
};