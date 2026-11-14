import Clock from 'lucide-react';

export default {
  id: 'timebilling',
  name: 'Time Billing',
  path: '/timebilling',
  icon: Clock,
  component: () => import('./TimeBillingDashboard'),
};