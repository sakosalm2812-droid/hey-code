import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Command } from 'cmdk';
import { useNavigation } from '@/context/NavigationContext';

export interface TopbarProps {
  className?: string;
  children?: React.ReactNode;
}

export function Topbar({
  className,
  children,
}: TopbarProps) {
  return (
    <motion.header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-primary/95 border-b border-border backdrop-blur-sm',
        className,
      )}
    >
      <div className='max-w-[1400px] mx-auto flex h-16 items-center justify-between px-6'>
        {/* Left: App Brand & Nav Trigger */}
        <div className='flex items-center gap-3'>
          <a
            href='/'
            className='flex items-center gap-2'
            style={{ color: 'var(--text-primary)' }}
          >
            <span className='text-xl font-bold' style={{ color: 'var(--accent)' }}>
              HEY
            </span>
            <span className='text-xs font-medium opacity-60' style={{ color: 'var(--accent)' }}>App</span>
          </a>

          {/* Mobile Nav Trigger */}
          <button
            className='p-2 rounded-md hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            aria-label='Open navigation'
            style={{ display: 'none' }}
          >
            <svg
              className='h-5 w-5'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M4 6h16M4 12h16M4 18h16'
            />
          </button>
        </div>

        {/* Center: Command Palette (Cmd+K) */}
        <Command
          placeholder='Cmd+K (or Ctrl+K) to ask HEY'
          className='relative flex-1 max-w-md'
          style={{ color: 'var(--text-primary)' }}
        >
          <Command.Input
            style={{
              width: '100%',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-field)',
              background: 'var(--glass-bg)',
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--text-primary)',
              '&::placeholder': { color: 'var(--text-muted)' },
            }}
          />
          <Command.Menu
            className='z-50 w-80 rounded-md bg-primary p-2 shadow-lg border border-border'
          >
            <Command.Group>
              <Command.Item>
                <span className='text-sm font-medium'>Recent</span>
              </Command.Item>
              <Command.Item>
                <span className='text-sm opacity-60'>Start new conversation</span>
              </Command.Item>
            </Command.Group>
          </Command.Menu>
        </Command>
      </div>

      {/* Right: User Profile & Notifications */}
      <div className='flex items-center gap-3'>
        {/* User Profile */}
        <div className='relative'>
          <button
            className='flex h-10 w-10 rounded-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            aria-label='User profile'
          >
            <img
              src='/placeholder-user.svg'
              alt='User'
              className='h-full w-full object-cover'
            />
          </button>
          <div
            className='absolute right-0 top-full mt-2 w-56 rounded-md bg-primary p-2 shadow-lg ring-1 ring-black ring-opacity-5'
            role='menu'
            aria-orientation='vertical'
            aria-label='Profile menu'
          >
            <div className='px-2 py-1 text-sm font-medium'>User Name</div>
            <div className='px-2 py-1 text-xs opacity-60'>user@hey.example</div>
            <MenuSeparator />
            <div className='px-2 py-1'>
              <span className='text-sm font-medium text-primary'>Settings</span>
            </div>
            <MenuSeparator />
            <div className='px-2 py-1'>
              <span className='text-sm font-medium text-destructive' onClick={() => alert('Sign out')}>Sign Out</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <button
          className='relative p-2 rounded-md hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          aria-label='Notifications'
        >
          <svg
            className='h-5 w-5'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M22 11.08V12a10 10 0 1 1-5.94-9.14.5.5 0 0 1 .78 0L22 11.08zM12 2a10 10 0 1 0 20 10A10.011 10.011 0 0 0 12 2zm-.3 9.58l.4.7A.5.5 0 0 1 11.5 23H8a.5.5 0 0 1-.37-.19l-.4-.7-1.5.3zM12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
          />
          <span className='absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent' />
        </button>
      </div>
    </motion.header>
  );
}