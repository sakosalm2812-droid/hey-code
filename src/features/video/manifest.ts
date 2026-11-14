import Video from 'lucide-react';

export default {
  id: 'video',
  name: 'Video',
  path: '/video',
  icon: Video,
  component: () => import('./VideoDashboard'),
};