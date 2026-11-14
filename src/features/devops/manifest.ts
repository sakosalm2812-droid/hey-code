import Server from 'lucide-react';

export default {
  id: 'devops',
  name: 'DevOps',
  path: '/devops',
  icon: Server,
  component: () => import('./DevOpsDashboard'),
};