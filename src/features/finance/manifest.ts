import CreditCard from 'lucide-react';

export default {
  id: 'finance',
  name: 'Finance',
  path: '/finance',
  icon: CreditCard,
  component: () => import('./FinanceDashboard'),
};