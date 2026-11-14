import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface SelectPrimitiveProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const SelectPrimitive = React.forwardRef<HTMLDivElement, SelectPrimitiveProps>(
  ({ className, children, ...props }, ref) => {
    const Comp = children ? children : 'div';
    return (
      <Comp
        ref={ref}
        className={cn(
  'rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  )}
        {...props}
      >
      </Comp>
    );
  }
);
SelectPrimitive.displayName = 'SelectPrimitive';

export interface SelectTriggerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const SelectTrigger = React.forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ className, ...props }) => {
    return (
      <div
        className={cn(
  'flex items-center justify-between rounded-md bg-secondary p-2 text-sm transition-colors hover:bg-secondary/50',
  )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

export interface SelectValueProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const SelectValue = React.forwardRef<HTMLDivElement, SelectValueProps>(
  ({ className, ...props }) => {
    return (
      <div
        className={cn(
  'flex items-center rounded-md bg-secondary p-1 text-sm transition-colors',
  )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectValue.displayName = 'SelectValue';

export interface SelectLabelProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

const SelectLabel = React.forwardRef<HTMLSpanElement, SelectLabelProps>(
  ({ className, ...props }) => {
    return (
      <span
        className={cn(
  'truncate w-max text-sm overflow-ellipsis',
  )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
SelectLabel.displayName = 'SelectLabel';

export interface SelectIconProps
  extends React.HTMLAttributes<HTMLSymbolElement> {
  asChild?: boolean;
}

const SelectIcon = React.forwardRef<HTMLSymbolElement, SelectIconProps>(
  ({ className, ...props }) => {
    return (
      <symbol
        className={cn('h-4 w-4 fill-current -mr-1')}
        {...props}
      >
        <path d="M6 9l6 6 6-6" />
      </symbol>
    );
  }
);
SelectIcon.displayName = 'SelectIcon';

export interface SelectScrollUpButtonProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const SelectScrollUpButton = React.forwardRef<HTMLButtonElement, SelectScrollUpButtonProps>(
  ({ className, ...props }) => {
    return (
      <button
        className={cn(
  'flex items-center rounded-md p-1 ml-1 flex-shrink-0 hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50',
  )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

export interface SelectScrollDownButtonProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const SelectScrollDownButton = React.forwardRef<HTMLButtonElement, SelectScrollDownButtonProps>(
  ({ className, ...props }) => {
    return (
      <button
        className={cn(
  'flex items-center rounded-md p-1 mr-1 flex-shrink-0 hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50',
  )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SelectScrollDownButton.displayName = 'SelectScrollDownButton';

export interface SelectContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }) => {
    return (
      <div
        className={cn(
  'absolute z-20 w-64 rounded-md bg-secondary p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 origin-top-right shadow-sm',
  )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = 'SelectContent';

export interface SelectContentWrapperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const SelectContentWrapper = React.forwardRef<HTMLDivElement, SelectContentWrapperProps>(
  ({ className, ...props }) => {
    return (
      <div
        className={cn(
  'flex flex-col items-start rounded-md bg-secondary p-1 shadow-sm',
  )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContentWrapper.displayName = 'SelectContentWrapper';

export interface SelectItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, ...props }) => {
    return (
      <div
        className={cn(
  'flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm select-none outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:select-none data-[disabled]:opacity-50',
)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';

export interface SelectSeparatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  ({ className, ...props }) => {
    return (
      <div
        className={cn('h-px my-1 bg-muted')}
        {...props}
      >
      </div>
    );
  }
);
SelectSeparator.displayName = 'SelectSeparator';

export interface SelectShortcutProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

const SelectShortcut = React.forwardRef<HTMLSpanElement, SelectShortcutProps>(
  ({ className, ...props }) => {
    return (
      <span
        className={cn('ml-auto text-xs font-medium opacity-60')}
        {...props}
      >
        {children}
      </span>
    );
  }
);
SelectShortcut.displayName = 'SelectShortcut';

export { SelectPrimitive, SelectTrigger, SelectValue, SelectLabel, SelectIcon, SelectScrollUpButton, SelectScrollDownButton, SelectContent, SelectContentWrapper, SelectItem, SelectSeparator, SelectShortcut };