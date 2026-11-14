import Coins from 'lucide-react';

export default {
  id: 'crypto',
  name: 'Crypto',
  path: '/crypto',
  icon: Coins,
  component: () => import('./CryptoDashboard'),
};