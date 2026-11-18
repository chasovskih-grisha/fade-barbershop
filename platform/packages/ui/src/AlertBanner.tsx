import type { ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { cn } from './cn';

// AlertBanner — банер помилки/успіху/інфо з токенів (T-4507c, admin/16-shared §Error
// Handling: «banner with error message + Retry»). error → role="alert" (агресивно),
// решта → role="status" (полагідно). Кольори тільки з токенів.

const TONES = {
  error: { border: 'border-semantic-danger/40', icon: 'alert' },
  success: { border: 'border-semantic-success/40', icon: 'check' },
  info: { border: 'border-line', icon: 'info' },
  warning: { border: 'border-semantic-warning/40', icon: 'alert' },
} as const;

export type AlertBannerTone = keyof typeof TONES;

export interface AlertBannerAction {
  label: string;
  onClick: () => void;
  /** Під час повторного запиту — кнопку блокуємо (подвійний клік = подвійний запит). */
  loading?: boolean;
}

export interface AlertBannerProps {
  tone?: AlertBannerTone;
  title: string;
  description?: string;
  /** Дія (типово «Спробувати ще раз»); без неї банер лише інформативний. */
  action?: AlertBannerAction;
  onDismiss?: () => void;
  className?: string;
  children?: ReactNode;
}

export function AlertBanner({
  tone = 'error',
  title,
  description,
  action,
  onDismiss,
  className,
  children,
}: AlertBannerProps) {
  const { border, icon } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-card border bg-surface-raised p-4 transition-all duration-200 shadow-sm',
        border,
        className
      )}
    >
      <Icon name={icon} size={24} className="mt-0.5 text-fg-secondary shrink-0" />
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="text-body font-medium text-fg leading-relaxed">{title}</p>
        {description ? <p className="text-caption text-fg-secondary leading-normal">{description}</p> : null}
        {children}
        {action ? (
          <div className="mt-2.5">
            <Button
              variant="secondary"
              size="md"
              loading={action.loading ?? false}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Закрити повідомлення"
          className="rounded-input p-1 text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue shrink-0"
        >
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </div>
  );
}
