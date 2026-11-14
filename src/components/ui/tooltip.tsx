import * as React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export interface TooltipProps
  extends React.ComponentPropsWithoutRef<'div'> {
  className?: string;
}

const TooltipPrimitive = TooltipProvider;

const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipProps>({
  forwardRef,
})({
  forwardRef,
})(
  ({ className, children, ...props }) => {
    return (
      <TooltipTrigger asChild>
        <button
          className={cn('rounded-md p-2 hover:bg-accent hover:text-accent-foreground', className)}
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
    );
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipProps>({
  forwardRef,
})({
  forwardRef,
})(
  ({ className, children, ...props }) => {
    return (
      <TooltipContent
        className={cn(
          'z-50 rounded-md bg-primary p-2 text-sm shadow-sm',
          'animate-in fade-in-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'data-[state=disabled]:pointer-events-none data-[state=disabled]:opacity-50',
          className,
          ...props,
        )}
      >
        {children}
      </TooltipContent>
    );
  }
);
TooltipContent.displayName = 'TooltipContent';

export { TooltipPrimitive, TooltipTrigger, TooltipContent };