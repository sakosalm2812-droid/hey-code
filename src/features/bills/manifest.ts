import CreditCard from 'lucide-react';

export default {
  id: 'bills',
  name: 'Bills',
  path: '/bills',
  icon: CreditCard,
  component: () => import('./BillsDashboard'),
};