import FileText from 'lucide-react';

export default {
  id: 'logs',
  name: 'Logs',
  path: '/logs',
  icon: FileText,
  component: () => import('./LogsDashboard'),
};