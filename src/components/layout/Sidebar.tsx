import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Menu, MenuItems, MenuTrigger, MenuContent } from '@radix-ui/react-menu';
import { Slider as SliderPrimitive } from '@radix-ui/react-slider';
import { useSidebarWidth } from '@/context/SidebarContext';

export interface SidebarProps {
  className?: string;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const DEFAULT_WIDTH_COLLAPSED = 68;
const DEFAULT_WIDTH_EXPANDED = 244;

export function useSidebarWidthState(defaultOpen = false) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [width, setWidth] = React.useState(defaultOpen ? DEFAULT_WIDTH_COLLAPSED : DEFAULT_WIDTH_EXPANDED);

  React.useEffect(() => {
    const handleResize = () => {
      setWidth(open ? DEFAULT_WIDTH_EXPANDED : DEFAULT_WIDTH_COLLAPSED);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open]);

  return { open, setOpen, width };
}

export function Sidebar({
  className,
  defaultOpen = false,
  onOpenChange,
  children,
}: SidebarProps) {
  const { open, setOpen, width } = useSidebarWidthState(defaultOpen);

  return (
    <motion.div
      className={cn('fixed inset-y left-0 z-50 w-full w-64 bg-primary border-r border-border transition-all duration-300 ease-hairline', className)}
      style={{ width: `${width}px` }}
      whileHover={{ width: `${DEFAULT_WIDTH_EXPANDED}px` }}
      whileTap={{ width: `${DEFAULT_WIDTH_COLLAPSED}px` }}
    >
      <div className='flex h-full flex-col pointer-events-none'>
        {/* Brand / Logo Area */}
        <motion.div
          className={cn('flex h-16 items-center justify-center px-4 select-none', 'data-[state=hover]:bg-accent/5')}
          whileHover={{ background: 'var(--accent)/5' }}
          whileTap={{ background: 'var(--accent)/10' }}
        >
          <span className='text-xs font-medium tracking-wider opacity-60' style={{ color: 'var(--accent)' }}>HEY</span>
        </motion.div>

        {/* Navigation */}
        <nav className='flex-1 flex flex-col pt-2 overflow-y-auto' style={{ flexGrow: 1 }}>
          <Menu>
            <MenuTrigger asChild>
              <button
                className='flex h-10 w-full items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                aria-label='Main menu'
              >
                <span className='flex-1 truncate' style={{ color: 'var(--text-primary)' }}>Navigation</span>
                <svg
                  className='shrink-0 h-4 w-4'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M5 12h14M12 5l7 7-7 7'
                />
              </button>
            </MenuTrigger>
            <MenuContent
              className='py-1 bg-primary text-sm select-none shadow-lg ring-1 ring-black ring-opacity-5'
            >
              <MenuItems>
                <MenuItem value="1">
                  <span className='flex items-center gap-3 px-3 py-2'>
                    <svg
                      className='shrink-0 h-5 w-5 text-muted-foreground'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 15v2m-6-6h12m-6 6v2'
                    />
                    <span>Dashboard</span>
                  </span>
                </MenuItem>
                <MenuItem value="2">
                  <span className='flex items-center gap-3 px-3 py-2'>
                    <svg
                      className='shrink-0 h-5 w-5 text-muted-foreground'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 4v16m8-8H4'
                    />
                    <span>Projects</span>
                  </span>
                </MenuItem>
                <MenuItem value="3">
                  <span className='flex items-center gap-3 px-3 py-2'>
                    <svg
                      className='shrink-0 h-5 w-5 text-muted-foreground'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 1v4l4 4h4v-4H8l-4-4H12z'
                    />
                    <span>Goals</span>
                  </span>
                </MenuItem>
                <MenuItem value="4">
                  <span className='flex items-center gap-3 px-3 py-2'>
                    <svg
                      className='shrink-0 h-5 w-5 text-muted-foreground'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 2s-8 4-8 10v4m10-4h-8m0 0h-4m-4 4h8'
                    />
                    <span>Forge</span>
                  </span>
                </MenuItem>
              </MenuItems>
            </MenuContent>
          </Menu>

          {/* Quick Actions or Search */}
          <div className='mt-6 pt-6 border-t border-border'>
            <span className='text-xs font-medium opacity-60 uppercase tracking-wider'>Quick</span>
            <span className='text-xs font-medium opacity-60 uppercase tracking-wider'>Actions</span>
          </div>
        </nav>

        {/* Collapse Button */}
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className='p-2 justify-center rounded-md transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 collapsed:hidden'
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg
            className='h-5 w-5'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            d={open ? 'M15 18l-6-6l6-6' : 'M12 3v2m0 12v2M21 21l-6-6l6-6'}
          />
        </motion.button>
      </div>
    </motion.div>
  );
}