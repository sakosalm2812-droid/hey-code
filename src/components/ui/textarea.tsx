import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  asChild?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, onFocus, onBlur, disabled, placeholder, ...props }, ref) => {
    const Comp = asChild ? Slot : 'textarea';
    return (
      <Comp
        ref={ref}
        className={cn(
          'flex min-h-[calc(auto+4rem)] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors resize-y',
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
Textarea.displayName = 'Textarea';

export { Textarea };