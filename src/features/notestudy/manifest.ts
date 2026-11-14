import FileText from 'lucide-react';

export default {
  id: 'notestudy',
  name: 'Notes Study',
  path: '/notestudy',
  icon: FileText,
  component: () => import('./NotesStudyDashboard'),
};