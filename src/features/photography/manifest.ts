import Image from 'lucide-react';

export default {
  id: 'photography',
  name: 'Photography',
  path: '/photography',
  icon: Image,
  component: () => import('./PhotographyDashboard'),
};