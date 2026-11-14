import Moon from 'lucide-react';

export default {
  id: 'sleep',
  name: 'Sleep',
  path: '/sleep',
  icon: Moon,
  component: () => import('./SleepDashboard'),
};