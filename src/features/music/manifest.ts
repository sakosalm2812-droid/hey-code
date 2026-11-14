import Music from 'lucide-react';

export default {
  id: 'music',
  name: 'Music',
  path: '/music',
  icon: Music,
  component: () => import('./MusicDashboard'),
};