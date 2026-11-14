import Globe from 'lucide-react';

export default {
  id: 'api',
  name: 'API',
  path: '/api',
  icon: Globe,
  component: () => import('./ApiDashboard'),
};