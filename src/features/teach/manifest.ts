import GraduationCap from 'lucide-react';

export default {
  id: 'teach',
  name: 'Teach',
  path: '/teach',
  icon: GraduationCap,
  component: () => import('./TeachDashboard'),
};