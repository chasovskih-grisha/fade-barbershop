import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: string | undefined;
  error?: string | undefined;
  indeterminate?: boolean;
}

export function Checkbox({ id, label, description, error, indeterminate, className, ...input }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="flex items-start gap-3 text-body text-fg cursor-pointer select-none">
        <input
          id={inputId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          ref={(node) => {
            if (node) {
              node.indeterminate = !!indeterminate;
            }
          }}
          className={cn(
            'mt-0.5 h-5 w-5 shrink-0 rounded-micro border bg-surface-sunken accent-accent-blue',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-semantic-danger' : 'border-line'
          )}
          {...input}
        />
        <span className="flex flex-col">
          <span>{label}</span>
          {description ? <span className="text-caption text-fg-muted">{description}</span> : null}
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
