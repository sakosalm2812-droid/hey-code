import Code from 'lucide-react';

export default {
  id: 'code',
  name: 'Code',
  path: '/code',
  icon: Code,
  component: () => import('./CodeDashboard'),
};