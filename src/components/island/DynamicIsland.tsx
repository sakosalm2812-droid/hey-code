import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DynamicIslandProps {
  className?: string;
  children?: React.ReactNode;
  status?: 'online' | 'away' | 'busy' | 'focus';
}

const PIP_FACE_SVG = `
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="24" cy="24" r="20" strokeWidth="2"/>
    <path d="M12 12h12M12 36h12M4 24h16M16 16l8 8M16 32l8-8"/>
  </svg>
`;

export function DynamicIsland({
  className,
  children,
  status = 'online',
}: DynamicIslandProps) {
  const statusColors = {
    online: 'var(--accent)',
    away: 'var(--gold)',
    busy: 'var(--semantic-destructive)',
    focus: 'var(--semantic-info)',
  };
  const statusBg = {
    online: 'rgba(15, 118, 133, 0.15)',
    away: 'rgba(212, 175, 56, 0.15)',
    busy: 'rgba(194, 70, 78, 0.15)',
    focus: 'rgba(74, 144, 217, 0.15)',
  };

  return (
    <motion.div
      className={cn(
        'dynamic-island fixed bottom-8 right-1/2 -translate-x-1/2 flex items-center gap-3 rounded-2xl bg-primary p-3 shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 z-50',
        statusBg[status] && `border-${statusColors[status]}`,
        className,
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className='flex-shrink-0 h-8 w-8 rounded-xl bg-secondary flex items-center justify-center' style={{ color: statusColors[status] }}>
        <svg
          dangerouslySetInnerHTML={{ __html: PIP_FACE_SVG }}
          className='h-5 w-5'
        />
      </div>

      <span
        style={{
          color: statusColors[status],
          fontWeight: 500,
          fontSize: 12,
        }}
      >
        {children || 'HEY'}
      </span>
    </motion.div>
  );
}