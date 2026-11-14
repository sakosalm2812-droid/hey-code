import Layout from 'lucide-react';

export default {
  id: 'moodboard',
  name: 'Mood Board',
  path: '/moodboard',
  icon: Layout,
  component: () => import('./MoodBoardDashboard'),
};