import type { HTMLAttributes } from 'react';
import { cn } from './cn';

const VARIANTS = {
  text: 'h-4 rounded-micro',
  circle: 'rounded-pill',
  rect: 'rounded-card',
} as const;

export type SkeletonVariant = keyof typeof VARIANTS;

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Shape variant of the skeleton loader.
   * @default 'text'
   */
  variant?: SkeletonVariant;
  /**
   * Whether to animate the pulse effect.
   * @default true
   */
  animate?: boolean;
  /**
   * Optional accessibility label for screen readers when skeleton represents specific loading content.
   */
  'aria-label'?: string;
}

export function Skeleton({
  variant = 'text',
  animate = true,
  className,
  'aria-label': ariaLabel,
  ...rest
}: SkeletonProps) {
  return (
    <span
      aria-hidden={ariaLabel ? undefined : 'true'}
      aria-label={ariaLabel}
      role={ariaLabel ? 'status' : undefined}
      className={cn(
        'block bg-surface-raised',
        animate && 'animate-pulse',
        VARIANTS[variant],
        className
      )}
      {...rest}
    />
  );
}
