import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  animate?: boolean;
}

const SkeletonLine = (height: string) => (
  <div
    className={cn(
      'rounded-md h-[{height}] bg-background/50 animate-pulse',
      ...props,
    )}
  />
);

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>({
  forwardRef,
})(
  ({ className, animate = true, ...props }) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-2',
          'divide-y divide-background/20',
          animate && 'animate-shimmer',
          className,
          ...props,
        )}
      >
        <div className="h-6 w-full rounded-md bg-background/50 animate-pulse" />
        <div className="h-6 w-full rounded-md bg-background/50 animate-pulse" />
        <div className="h-6 w-3/4 rounded-md bg-background/50 animate-pulse" />
        <div className="h-6 w-full rounded-md bg-background/50 animate-pulse" />
        <div className="h-6 w-1/2 rounded-md bg-background/50 animate-pulse" />
      </div>
    );
  }
);
Skeleton.displayName = 'Skeleton';

export { Skeleton };