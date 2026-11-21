import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

const TONES = {
  neutral: 'border border-line bg-surface-raised text-fg-secondary',
  accent: 'border border-accent-blue/40 bg-accent-blue/10 text-accent-blue',
  success: 'border border-semantic-success/30 bg-semantic-success/15 text-semantic-success',
  warning: 'border border-semantic-warning/30 bg-semantic-warning/15 text-semantic-warning',
  danger: 'border border-semantic-danger/30 bg-semantic-danger/15 text-semantic-danger',
  info: 'border border-semantic-info/30 bg-semantic-info/15 text-semantic-info',
} as const;

export type BadgeTone = keyof typeof TONES;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  /** Optional accessibility role (defaults to status/generic) */
  role?: string;
}

export function Badge({ tone = 'neutral', children, className, role, ...rest }: BadgeProps) {
  return (
    <span
      role={role ?? (rest['aria-label'] || rest['aria-labelledby'] ? 'status' : undefined)}
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-caption font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50 border',
        TONES[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
