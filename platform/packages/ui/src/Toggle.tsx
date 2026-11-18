import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: string | undefined;
  error?: string | undefined;
}

export function Toggle({ id, label, description, error, className, ...input }: ToggleProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="flex items-center justify-between gap-4 text-body text-fg cursor-pointer select-none">
        <span className="flex flex-col">
          <span>{label}</span>
          {description ? <span className="text-caption text-fg-muted">{description}</span> : null}
        </span>
        <span className="relative inline-flex shrink-0 items-center">
          <input
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              'peer sr-only',
              'disabled:cursor-not-allowed'
            )}
            {...input}
          />
          <span className={cn(
            'h-6 w-11 rounded-full border bg-surface-sunken transition-colors',
            'border-line',
            'peer-checked:bg-accent peer-checked:border-accent',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-accent-blue peer-focus-visible:outline-none',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            error ? 'border-semantic-danger' : ''
          )}>
            <span className={cn(
              'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-fg transition-transform',
              'peer-checked:translate-x-5 peer-checked:bg-surface-base'
            )} />
          </span>
        </span>
      </label>
      {error ? (
        <p id={errorId} role="alert" className="text-caption text-semantic-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
