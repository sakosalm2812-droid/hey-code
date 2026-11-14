import Footprints from 'lucide-react';

export default {
  id: 'steps',
  name: 'Steps',
  path: '/steps',
  icon: Footprints,
  component: () => import('./StepsDashboard'),
};