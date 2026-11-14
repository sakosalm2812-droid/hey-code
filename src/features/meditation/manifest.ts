import Brain from 'lucide-react';

export default {
  id: 'meditation',
  name: 'Meditation',
  path: '/meditation',
  icon: Brain,
  component: () => import('./MeditationDashboard'),
};