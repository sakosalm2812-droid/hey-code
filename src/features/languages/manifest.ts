import Languages from 'lucide-react';

export default {
  id: 'languages',
  name: 'Languages',
  path: '/languages',
  icon: Languages,
  component: () => import('./LanguagesDashboard'),
};