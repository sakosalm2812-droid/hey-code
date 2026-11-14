import BarChart3 from 'lucide-react';

export default {
  id: 'reports',
  name: 'Reports',
  path: '/reports',
  icon: BarChart3,
  component: () => import('./ReportsDashboard'),
};