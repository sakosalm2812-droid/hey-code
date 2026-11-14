import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface TogglePrimitiveProps
  extends React.ComponentPropsWithoutRef<'button'> {
  asChild?: boolean;
}

const TogglePrimitive = React.forwardRef<HTMLButtonElement, TogglePrimitiveProps>(
  ({ className, variant = "default", asChild = false, ...props }) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          'flex h-5 w-9 rounded-full bg-secondary transition-colors items-center justify-between p-0.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          variant === "secondary" && 'border-2 border-input',
          ...props.className,
        )}
        {...props}
      >
        {asChild ? children : (
          <span
            className={cn(
              'block h-4 w-4 rounded-full transition-colors bg-primary',
              'data-[state=unchecked]:bg-secondary',
              'data-[state=checked]:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
          />
        )}
      </Comp>
    );
  }
);
TogglePrimitive.displayName = 'TogglePrimitive';

export { TogglePrimitive };