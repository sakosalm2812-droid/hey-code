import Palette from 'lucide-react';

export default {
  id: 'design',
  name: 'Design',
  path: '/design',
  icon: Palette,
  component: () => import('./DesignDashboard'),
};