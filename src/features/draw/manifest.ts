import Pen from 'lucide-react';

export default {
  id: 'draw',
  name: 'Draw',
  path: '/draw',
  icon: Pen,
  component: () => import('./DrawDashboard'),
};