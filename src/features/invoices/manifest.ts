import FileText from 'lucide-react';

export default {
  id: 'invoices',
  name: 'Invoices',
  path: '/invoices',
  icon: FileText,
  component: () => import('./InvoicesDashboard'),
};