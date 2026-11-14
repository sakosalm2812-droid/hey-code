import Mic from 'lucide-react';

export default {
  id: 'voicememos',
  name: 'Voice Memos',
  path: '/voicememos',
  icon: Mic,
  component: () => import('./VoiceMemosDashboard'),
};