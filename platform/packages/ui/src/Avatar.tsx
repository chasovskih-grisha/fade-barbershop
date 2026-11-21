import type { HTMLAttributes } from 'react';
import { cn } from './cn';
import { getAvatarA11y } from './avatar-a11y';
import {
  getSizeClass,
  getSizeStyle,
  getStatusDotClass,
  VARIANTS,
  type AvatarSize,
  type AvatarStatus,
  type AvatarVariant,
} from './avatar-models';
import { AvatarVisual } from './avatar-visual';

export type { AvatarSize, AvatarStatus, AvatarVariant } from './avatar-models';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  status?: AvatarStatus;
  className?: string;
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  variant = 'round',
  status,
  className,
  ...rest
}: AvatarProps) {
  const a11y = getAvatarA11y(name, alt);

  return (
    <div
      role={a11y.role}
      aria-label={a11y.ariaLabel}
      className={cn(
        'relative inline-flex items-center justify-center bg-surface-raised font-medium text-fg-secondary overflow-hidden select-none shrink-0 border border-line',
        VARIANTS[variant],
        getSizeClass(size),
        className
      )}
      style={getSizeStyle(size)}
      {...rest}
    >
      <AvatarVisual src={src} alt={alt} name={name} size={size} />
      {status && (
        <span className={getStatusDotClass(size, status)} aria-label={`Status: ${status}`} />
      )}
    </div>
  );
}
