import Database from 'lucide-react';

export default {
  id: 'database',
  name: 'Database',
  path: '/database',
  icon: Database,
  component: () => import('./DatabaseDashboard'),
};