import Award from 'lucide-react';

export default {
  id: 'certificates',
  name: 'Certificates',
  path: '/certificates',
  icon: Award,
  component: () => import('./CertificatesDashboard'),
};