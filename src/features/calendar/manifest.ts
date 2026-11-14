import CalendarDays from 'lucide-react';

export default {
  id: 'calendar',
  name: 'Calendar',
  path: '/calendar',
  icon: CalendarDays,
  component: () => import('./CalendarDashboard'),
};