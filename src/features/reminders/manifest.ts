import Bell from 'lucide-react';

export default {
  id: 'reminders',
  name: 'Reminders',
  path: '/reminders',
  icon: Bell,
  component: () => import('./RemindersDashboard'),
};