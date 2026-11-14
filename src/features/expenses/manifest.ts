import Receipt from 'lucide-react';

export default {
  id: 'expenses',
  name: 'Expenses',
  path: '/expenses',
  icon: Receipt,
  component: () => import('./ExpensesDashboard'),
};