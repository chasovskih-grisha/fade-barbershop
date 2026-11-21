import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export interface CardGridProps extends HTMLAttributes<HTMLDivElement> {}

export function CardGrid({ className, children, ...rest }: CardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3',
        '[&>*:only-child]:col-span-full [&>*:only-child]:max-w-md [&>*:only-child]:mx-auto [&>*:only-child]:w-full',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
