import UserPlus from 'lucide-react';

export default {
  id: 'crm',
  name: 'CRM',
  path: '/crm',
  icon: UserPlus,
  component: () => import('./CrmDashboard'),
};