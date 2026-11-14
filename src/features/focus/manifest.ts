import Timer from 'lucide-react';

export default {
  id: 'focus',
  name: 'Focus Timer',
  path: '/focus',
  icon: Timer,
  component: () => import('./FocusDashboard'),
};