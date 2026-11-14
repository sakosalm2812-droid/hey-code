import ShoppingCart from 'lucide-react';

export default {
  id: 'groceries',
  name: 'Groceries',
  path: '/groceries',
  icon: ShoppingCart,
  component: () => import('./GroceriesDashboard'),
};