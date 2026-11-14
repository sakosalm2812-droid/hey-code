import Wrench from 'lucide-react';

export default {
  id: 'homemaintenance',
  name: 'Home Maintenance',
  path: '/homemaintenance',
  icon: Wrench,
  component: () => import('./HomeMaintenanceDashboard'),
};