import Users from 'lucide-react';

export default {
  id: 'contacts',
  name: 'Contacts',
  path: '/contacts',
  icon: Users,
  component: () => import('./ContactsDashboard'),
};