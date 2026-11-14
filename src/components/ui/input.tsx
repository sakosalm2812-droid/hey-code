import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  asChild?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, onChange, onFocus, onBlur, disabled, placeholder, ...props }, ref) => {
    const Comp = asChild ? Slot : 'input';
    return (
      <Comp
        ref={ref}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:placeholder-color-[var(--primary-foreground)] file:text-file[&::placeholder]:text-file[&.disabled]:opacity-50',
          'placeholder-text-color:var(--primary-foreground)',
          className,
        )}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };