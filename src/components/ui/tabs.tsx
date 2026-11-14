import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export interface TabsProps
  extends React.ComponentPropsWithoutRef<'div'> {
  className?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  autocomplete?: 'on' | 'off';
}

const TabsPrimitive = React.forwardRef<HTMLDivElement, TabsProps>({
  forwardRef,
})({
  forwardRef,
})(
  ({ className, defaultValue, value, onValueChange, autocomplete, ...props }) => {
    return (
      <Tabs
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        autocomplete={autocomplete}
        className={cn(
          'w-full border-b bg-background',
          ...className,
        )}
        {...props}
      >
        <TabsList
          className={cn(
            'flex w-full rounded-md bg-secondary p-0',
            ...className,
          )}
        >
          {children}
        </TabsList>
        {React.Children.toArray(children).filter(
          (child) => React.isValidElement(child) && child.props.tab,
        ).map((child) => {
          const trigger = React.Children.toArray(TabsList.children).find(
            (c) => React.isValidElement(c) && !c.props.tab,
          );
          return child;
        })}
        <TabsContent className="p-4">
          {children}
        </TabsContent>
      </Tabs>
    );
  }
});
TabsPrimitive.displayName = 'Tabs';

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<'div'> {
  className?: string;
}

const TabsListRoot = React.forwardRef<HTMLDivElement, TabsListProps>({
  forwardRef,
})({
  forwardRef,
})(
  ({ className, ...props }) => {
    return (
      <TabsList
        className={cn(
          'flex w-full rounded-md bg-secondary p-0',
          ...className,
        )}
        {...props}
      >
      </TabsList>
    );
  }
);
TabsListRoot.displayName = 'TabsListRoot';

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<'button'> {
  value: string;
  className?: string;
  disabled?: boolean;
}

const TabsTriggerRoot = React.forwardRef<HTMLButtonElement, TabsTriggerProps>({
  forwardRef,
})({
  forwardRef,
})(
  ({ className, value, disabled, children, ...props }) => {
    return (
      <button
        className={cn(
          'flex-1 rounded-md py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=active]:bg-accent data-[state=active]:text-on-accent',
          disabled && 'disabled:opacity-50',
          className,
        )}
        value={value}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTriggerRoot.displayName = 'TabsTriggerRoot';

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<'div'> {
  value: string;
  className?: string;
}

const TabsContentRoot = React.forwardRef<HTMLDivElement, TabsContentProps>({
  forwardRef,
})({
  forwardRef,
})(
  ({ className, value, children, ...props }) => {
    return (
      <TabsContent
        className={cn(
          'pt-1',
          'fade-in-0 transition-opacity',
          ...className,
        )}
        value={value}
        {...props}
      >
        {children}
      </TabsContent>
    );
  }
);
TabsContentRoot.displayName = 'TabsContentRoot';

export { TabsPrimitive, TabsListRoot, TabsTriggerRoot, TabsContentRoot };