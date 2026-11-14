import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface BadgePrimitiveProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

const BadgePrimitive = React.forwardRef<HTMLSpanElement, BadgePrimitiveProps>(
  ({ className, variant = "default", asChild = false, ...props }) => {
    const Comp = asChild ? Slot : 'span';
    return (
      <Comp
        className={cn(
          'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium',
          'ring-offset-background',
          variant === "default" && 'bg-secondary text-secondary-foreground',
          variant === "destructive" && 'bg-destructive text-destructive-foreground',
          variant === "outline" && 'border border-input bg-transparent text-primary',
          variant === "secondary" && 'bg-secondary text-secondary-foreground',
          variant === "ghost" && 'hover:bg-accent hover:text-accent-foreground',
          ...className,
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
BadgePrimitive.displayName = 'BadgePrimitive';

export { BadgePrimitive };