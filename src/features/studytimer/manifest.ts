import Timer from 'lucide-react';

export default {
  id: 'studytimer',
  name: 'Study Timer',
  path: '/studytimer',
  icon: Timer,
  component: () => import('./StudyTimerDashboard'),
};