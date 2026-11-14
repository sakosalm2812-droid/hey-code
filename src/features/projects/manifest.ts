import FolderGit2 from 'lucide-react';

export default {
  id: 'projects',
  name: 'Projects',
  path: '/projects',
  icon: FolderGit2,
  component: () => import('./ProjectsDashboard'),
};