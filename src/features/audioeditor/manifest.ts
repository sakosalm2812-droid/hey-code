import SlidersHorizontal from 'lucide-react';

export default {
  id: 'audioeditor',
  name: 'Audio Editor',
  path: '/audioeditor',
  icon: SlidersHorizontal,
  component: () => import('./AudioEditorDashboard'),
};