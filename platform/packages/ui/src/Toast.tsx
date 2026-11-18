import { useEffect } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

const TONES = {
  info: 'border-line',
  success: 'border-semantic-success/40',
  warning: 'border-semantic-warning/40',
  danger: 'border-semantic-danger/40',
} as const;

export type ToastTone = keyof typeof TONES;

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  tone?: ToastTone;
  description?: string | undefined;
  action?: ReactNode | undefined;
  onClose?: (() => void) | undefined;
  duration?: number | undefined;
  className?: string | undefined;
}

export function Toast({
  title,
  tone = 'info',
  description,
  action,
  onClose,
  duration,
  className,
  role,
  ...rest
}: ToastProps) {
  useEffect(() => {
    if (!onClose || !duration) return undefined;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      role={role ?? (tone === 'danger' ? 'alert' : 'status')}
      className={cn(
        'flex w-full max-w-sm items-start gap-3 rounded-card border bg-surface-raised p-3',
        TONES[tone],
        className
      )}
      {...rest}
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-body font-medium text-fg">{title}</p>
        {description ? <p className="text-caption text-fg-muted">{description}</p> : null}
      </div>
      {action}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити"
          className="rounded-micro p-1 text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

export interface ToastViewportProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string | undefined;
}

export function ToastViewport({ children, className, ...rest }: ToastViewportProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
