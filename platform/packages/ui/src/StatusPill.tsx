import type { HTMLAttributes } from 'react';
import tokens from '@fade/design-tokens/tokens.json';
import { cn } from './cn';

const TONES = {
  neutral: 'bg-interactive text-fg',
  info: 'bg-semantic-info/15 text-semantic-info',
  accent: 'border border-accent-blue/40 text-accent-blue',
  success: 'bg-semantic-success/15 text-semantic-success',
  muted: 'border border-line bg-surface-raised text-fg-muted',
  warning: 'bg-semantic-warning/15 text-semantic-warning',
  danger: 'bg-semantic-danger/15 text-semantic-danger',
} as const;

export type StatusTone = keyof typeof TONES;

export type VisitStatus =
  | 'booked'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'waitlist_hold';

const LABELS: Record<VisitStatus, string> = {
  booked: 'Заброньовано',
  confirmed: 'Підтверджено',
  in_progress: 'В процесі',
  completed: 'Завершено',
  cancelled: 'Скасовано',
  no_show: 'Не прийшов',
  waitlist_hold: 'Лист очікування',
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  status: VisitStatus;
  label?: string;
  className?: string;
  /** Optional accessibility role (defaults to status) */
  role?: string;
}

export function StatusPill({ status, label, className, role, ...rest }: StatusPillProps) {
  const tone = (tokens.visitStatus[status] as { tone: StatusTone }).tone;
  return (
    <span
      role={role ?? 'status'}
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-caption font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue/50 border border-transparent',
        TONES[tone],
        className
      )}
      {...rest}
    >
      {label ?? LABELS[status]}
    </span>
  );
}
