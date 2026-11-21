import type { HTMLAttributes } from 'react';
import { cn } from './cn';
import { Button } from './Button';
import { StatusPill } from './StatusPill';

export interface ReferenceScreenPreviewProps extends HTMLAttributes<HTMLDivElement> {
  screenType: 'web-home' | 'admin-shell' | 'slot-flow' | 'mobile-home';
}

export function ReferenceScreenPreview({
  screenType,
  className,
  ...rest
}: ReferenceScreenPreviewProps) {
  return (
    <div
      role="region"
      aria-label={`Reference screen: ${screenType}`}
      className={cn(
        'p-6 rounded-xl border bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-sm transition-colors',
        'sm:p-8 lg:p-10',
        className
      )}
      {...rest}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {screenType}
        </span>
        <StatusPill status="confirmed">Token Verified</StatusPill>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          FADE Reference Screen: {screenType}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Neighborhood luxury and friction-free interaction showcase adhering to design tokens and
          accessibility standards.
        </p>
        <div className="pt-2">
          <Button variant="primary" aria-label={`Action for ${screenType}`}>
            Interact / Book
          </Button>
        </div>
      </div>
    </div>
  );
}
