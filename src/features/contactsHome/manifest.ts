import Users from 'lucide-react';

export default {
  id: 'contactsHome',
  name: 'Contacts Home',
  path: '/contactsHome',
  icon: Users,
  component: () => import('./ContactsHomeDashboard'),
};