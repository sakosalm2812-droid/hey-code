import UtensilsCrossed from 'lucide-react';

export default {
  id: 'nutrition',
  name: 'Nutrition',
  path: '/nutrition',
  icon: UtensilsCrossed,
  component: () => import('./NutritionDashboard'),
};