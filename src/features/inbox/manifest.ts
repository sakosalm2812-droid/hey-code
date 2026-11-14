import Inbox from 'lucide-react';

export default {
  id: 'inbox',
  name: 'Inbox',
  path: '/inbox',
  icon: Inbox,
  component: () => import('./InboxDashboard'),
};