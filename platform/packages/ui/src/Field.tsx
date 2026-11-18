import type { ReactNode } from 'react';
import { cn } from './cn';
import { messageIds } from './fieldUtils';

export interface FieldProps {
  id: string;
  label: string;
  help?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
}

export function Field({ id, label, help, error, required, className, children }: FieldProps) {
  const { helpId, errorId } = messageIds(id, help, error);
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-caption font-medium text-fg-secondary">
        {label}
        {required ? <span className="text-semantic-danger"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-caption text-semantic-danger">
          {error}
        </p>
      ) : help ? (
        <p id={helpId} className="text-caption text-fg-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}
