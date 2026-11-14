import Film from 'lucide-react';

export default {
  id: 'storyboard',
  name: 'Storyboard',
  path: '/storyboard',
  icon: Film,
  component: () => import('./StoryboardDashboard'),
};