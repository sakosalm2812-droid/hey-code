import Calculator from 'lucide-react';

export default {
  id: 'tax',
  name: 'Tax',
  path: '/tax',
  icon: Calculator,
  component: () => import('./TaxDashboard'),
};