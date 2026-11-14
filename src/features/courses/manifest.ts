import BookOpen from 'lucide-react';

export default {
  id: 'courses',
  name: 'Courses',
  path: '/courses',
  icon: BookOpen,
  component: () => import('./CoursesDashboard'),
};