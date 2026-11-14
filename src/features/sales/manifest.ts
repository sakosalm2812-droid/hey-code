import TrendingUp from 'lucide-react';

export default {
  id: 'sales',
  name: 'Sales',
  path: '/sales',
  icon: TrendingUp,
  component: () => import('./SalesDashboard'),
};