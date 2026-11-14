import CloudSun from 'lucide-react';

export default {
  id: 'weather',
  name: 'Weather',
  path: '/weather',
  icon: CloudSun,
  component: () => import('./WeatherDashboard'),
};