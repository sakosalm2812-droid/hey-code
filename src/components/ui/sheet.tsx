import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface SheetProps
  extends React.ComponentPropsWithoutRef<'div'> {
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const SheetOverlay = React.forwardRef<HTMLDivElement, SheetProps>({
  forwardRef,
})(
  ({ className, ...props }) => {
    return (
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm',
          ...props,
        )}
      />
    );
  }
);
SheetOverlay.displayName = 'SheetOverlay';

const SheetContent = React.forwardRef<HTMLDivElement, SheetProps>({
  forwardRef,
})(
  ({ className, open, onOpenChange, children, ...props }) => {
    const shouldAnimate = !open; // Enter animation when opening

    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        className={cn(
          'fixed bottom-0 left-0 right-auto w-full max-w-md transform transition-transform duration-300 ease-out sm:translate-x-0 sm:translate-y-full sm:bottom-auto',
          'sm:rounded-t-2xl sm:bg-primary',
          'z-50 border-t',
          ...className,
        )}
      >
        <DialogContent
          className={cn(
            'flex flex-col p-4 pt-2 pb-8',
            'border-t-2 border-primary',
            'animate-in fade-in-0',
            'sm:pt-6',
            ...className,
          )}
        >
          <DialogHeader className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <DialogTitle className="text-xl font-semibold" />
            <DialogDescription className="text-sm text-muted-foreground" />
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }
);
SheetContent.displayName = 'SheetContent';

export { SheetOverlay, SheetContent };