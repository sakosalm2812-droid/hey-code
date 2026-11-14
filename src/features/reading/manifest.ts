import Book from 'lucide-react';

export default {
  id: 'reading',
  name: 'Reading',
  path: '/reading',
  icon: Book,
  component: () => import('./ReadingDashboard'),
};