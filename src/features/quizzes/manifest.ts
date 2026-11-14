import HelpCircle from 'lucide-react';

export default {
  id: 'quizzes',
  name: 'Quizzes',
  path: '/quizzes',
  icon: HelpCircle,
  component: () => import('./QuizzesDashboard'),
};