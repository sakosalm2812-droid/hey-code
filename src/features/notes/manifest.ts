import FileText from 'lucide-react';

export default {
  id: 'notes',
  name: 'Notes',
  path: '/notes',
  icon: FileText,
  component: () => import('./NotesDashboard'),
};