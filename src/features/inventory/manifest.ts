import Package from 'lucide-react';

export default {
  id: 'inventory',
  name: 'Inventory',
  path: '/inventory',
  icon: Package,
  component: () => import('./InventoryDashboard'),
};