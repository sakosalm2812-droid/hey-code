import * as React from 'react';
import { Checkbox } from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<'div'> {
  /**
   * @default true
   */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CheckboxRoot = Checkbox.Root;

const CheckboxItem = Checkbox.Item;

const CheckboxLabel = React.forwardRef<HTMLLabelElement, CheckboxProps>({
  forwardRef,
})(
  ({ className, checked, onCheckedChange, disabled, children, ...props }) => {
    return (
      <label
        className={cn(
          'flex items-center cursor-pointer select-none',
          'group data-[state=checked]:bg-accent',
          'group-data-[state=checked]:text-on-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
        {...props}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="rounded-sm"
        />
        {children}
      </label>
    );
  }
);
CheckboxLabel.displayName = 'Checkbox';

export { CheckboxRoot, CheckboxItem, CheckboxLabel };