import Book from 'lucide-react';

export default {
  id: 'readinglist',
  name: 'Reading List',
  path: '/readinglist',
  icon: Book,
  component: () => import('./ReadingListDashboard'),
};