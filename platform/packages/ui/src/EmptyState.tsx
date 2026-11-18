import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';
import type { IconName } from './icons';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  iconName?: IconName;
  className?: string;
  /** Optional visual size variant for layout tuning */
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  iconName,
  className,
  size = 'md',
  role = 'region',
  'aria-label': ariaLabel,
  ...rest
}: EmptyStateProps) {
  const sizeStyles = {
    sm: 'p-6 gap-2',
    md: 'p-8 gap-3',
    lg: 'p-12 gap-4',
  };

  const iconSizes = {
    sm: { container: 'h-10 w-10', iconSize: 16 as const },
    md: { container: 'h-12 w-12', iconSize: 24 as const },
    lg: { container: 'h-16 w-16', iconSize: 24 as const },
  };

  const currentSize = iconSizes[size];

  return (
    <div
      role={role}
      aria-label={ariaLabel || title}
      className={cn(
        'flex flex-col items-center rounded-card border border-line bg-surface-raised text-center shadow-subtle transition-all duration-200',
        sizeStyles[size],
        className
      )}
      {...rest}
    >
      {icon ? (
        <div className={cn('flex items-center justify-center rounded-full bg-surface text-fg-muted border border-line mb-1 shadow-xs', currentSize.container)} aria-hidden="true">
          {icon}
        </div>
      ) : iconName ? (
        <div className={cn('flex items-center justify-center rounded-full bg-surface text-fg-muted border border-line mb-1 shadow-xs', currentSize.container)} aria-hidden="true">
          <Icon name={iconName} size={currentSize.iconSize} />
        </div>
      ) : null}
      <p className={cn('font-display text-fg', size === 'lg' ? 'text-h3' : size === 'sm' ? 'text-body-lg font-semibold' : 'text-h4')}>{title}</p>
      {description ? <p className={cn('text-fg-muted max-w-sm', size === 'lg' ? 'text-body-lg' : 'text-body')}>{description}</p> : null}
      {action ? <div className={cn(size === 'lg' ? 'mt-4' : 'mt-2')}>{action}</div> : null}
    </div>
  );
}
