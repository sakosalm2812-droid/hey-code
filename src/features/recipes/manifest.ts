import UtensilsCrossed from 'lucide-react';

export default {
  id: 'recipes',
  name: 'Recipes',
  path: '/recipes',
  icon: UtensilsCrossed,
  component: () => import('./RecipesDashboard'),
};