import BookOpen from 'lucide-react';

export default {
  id: 'journal',
  name: 'Journal',
  path: '/journal',
  icon: BookOpen,
  component: () => import('./JournalDashboard'),
};