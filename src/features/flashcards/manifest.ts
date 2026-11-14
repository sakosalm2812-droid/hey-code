import Layers from 'lucide-react';

export default {
  id: 'flashcards',
  name: 'Flashcards',
  path: '/flashcards',
  icon: Layers,
  component: () => import('./FlashcardsDashboard'),
};