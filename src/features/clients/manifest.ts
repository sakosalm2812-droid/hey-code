import Users from 'lucide-react';

export default {
  id: 'clients',
  name: 'Clients',
  path: '/clients',
  icon: Users,
  component: () => import('./ClientsDashboard'),
};