import Heart from 'lucide-react';

export default {
  id: 'pets',
  name: 'Pets',
  path: '/pets',
  icon: Heart,
  component: () => import('./PetsDashboard'),
};