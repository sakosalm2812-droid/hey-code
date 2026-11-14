import PenTool from 'lucide-react';

export default {
  id: 'writing',
  name: 'Writing',
  path: '/writing',
  icon: PenTool,
  component: () => import('./WritingDashboard'),
};