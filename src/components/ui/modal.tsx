import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ModalPrimitiveProps
  extends React.ComponentPropsWithoutRef<'div'> {
  asChild?: boolean;
}

const ModalOverlay = React.forwardRef<HTMLDivElement, ModalPrimitiveProps>(
  ({ className, children, ...props }) => {
    return (
      <Slot
        className={cn(
  'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
  }}
        {...props}
      >
        {children}
      </Slot>
    );
  }
);
ModalOverlay.displayName = 'ModalOverlay';

const ModalContent = React.forwardRef<HTMLDivElement, ModalPrimitiveProps>(
  ({ className, children, ...props }) => {
    return (
      <Slot
        className={cn(
  'fixed bottom-0 left-1/2 max-w-7xl transform -translate-x-1/2 bottom-8 w-full max-h-[80vh] rounded-2xl bg-primary p-6 shadow-xl transition-all aria-label="modal",
  )}
        {...props}
      >
        {children}
      </Slot>
    );
  }
);
ModalContent.displayName = 'ModalContent';

export { ModalOverlay, ModalContent };