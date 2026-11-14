import Lock from 'lucide-react';

export default {
  id: 'passwords',
  name: 'Passwords',
  path: '/passwords',
  icon: Lock,
  component: () => import('./PasswordsDashboard'),
};