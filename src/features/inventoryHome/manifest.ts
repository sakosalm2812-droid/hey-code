import Package from 'lucide-react';

export default {
  id: 'inventoryHome',
  name: 'Inventory Home',
  path: '/inventoryHome',
  icon: Package,
  component: () => import('./InventoryHomeDashboard'),
};