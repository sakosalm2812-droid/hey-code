import Droplets from 'lucide-react';

export default {
  id: 'water',
  name: 'Water Intake',
  path: '/water',
  icon: Droplets,
  component: () => import('./WaterDashboard'),
};