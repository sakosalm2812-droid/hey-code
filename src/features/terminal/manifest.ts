import Terminal from 'lucide-react';

export default {
  id: 'terminal',
  name: 'Terminal',
  path: '/terminal',
  icon: Terminal,
  component: () => import('./TerminalDashboard'),
};