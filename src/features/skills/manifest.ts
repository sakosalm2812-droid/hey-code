import Zap from 'lucide-react';

export default {
  id: 'skills',
  name: 'Skills',
  path: '/skills',
  icon: Zap,
  component: () => import('./SkillsDashboard'),
};