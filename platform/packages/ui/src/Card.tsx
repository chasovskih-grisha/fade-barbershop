import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  /**
   * Padding variant for the card.
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDINGS = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

export function Card({
  interactive = false,
  padding = 'md',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        'rounded-card border border-line bg-surface-raised text-fg',
        PADDINGS[padding],
        interactive &&
          'cursor-pointer transition-colors hover:border-line-strong hover:bg-surface-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
