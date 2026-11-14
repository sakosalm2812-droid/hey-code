import Sprout from 'lucide-react';

export default {
  id: 'plants',
  name: 'Plants',
  path: '/plants',
  icon: Sprout,
  component: () => import('./PlantsDashboard'),
};