import Code from 'lucide-react';

export default {
  id: 'snippets',
  name: 'Snippets',
  path: '/snippets',
  icon: Code,
  component: () => import('./SnippetsDashboard'),
};