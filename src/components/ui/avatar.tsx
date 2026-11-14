import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface AvatarPrimitiveProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  asChild?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarPrimitiveProps>(
  ({ className, src, alt, size = "md", asChild = false, ...props }) => {
    const Comp = asChild ? Slot : 'img';
    const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
    return (
      <Comp
        className={cn(
          'rounded-full overflow-hidden',
          sizes[size],
          'border-2 border-primary',
          className,
        )}
        src={src}
        alt={alt}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarPrimitiveProps>(
  ({ className, children, size = "md", asChild = false, ...props }) => {
    const Comp = asChild ? Slot : 'div';
    const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
    return (
      <Comp
        className={cn(
          'rounded-full flex items-center justify-center flex-shrink-0',
          sizes[size],
          'font-medium',
          'border-2 border-primary',
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
AvatarFallback.displayName = 'AvatarFallback';

export interface AvatarGroupPrimitiveProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupPrimitiveProps>(
  ({ className, children, ...props }) => {
    return (
      <div
        className={cn('flex items-center space-x-2', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<'img'> {
  asChild?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export { AvatarImage, AvatarFallback, AvatarGroup };