import { useState, type HTMLAttributes } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' } as const;
export type AvatarSize = keyof typeof SIZES | number;
const VARIANTS = { round: 'rounded-full', square: 'rounded-lg' } as const;
export type AvatarVariant = keyof typeof VARIANTS;
const STATUS_COLORS = { online: 'bg-semantic-success', offline: 'bg-fg-muted', busy: 'bg-semantic-danger', away: 'bg-semantic-warning' } as const;
export type AvatarStatus = keyof typeof STATUS_COLORS | string;

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  status?: AvatarStatus;
  className?: string;
}

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 && parts[0] && parts[1]
    ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    : parts[0] ? parts[0].slice(0, 2).toUpperCase() : '';
}

  // eslint-disable-next-line complexity
export function Avatar({ src, alt, name, size = 'md', variant = 'round', status, className, ...rest }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const initials = getInitials(name);
  const showImg = Boolean(src) && !imgError;
  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : undefined;
  const sizeClass = typeof size === 'string' && size in SIZES ? SIZES[size as keyof typeof SIZES] : undefined;
  const iconSize = typeof size === 'number' ? (size < 36 ? 16 : 24) : size === 'sm' ? 16 : 24;

  return (
    <div
      role={name || alt ? 'img' : undefined}
      aria-label={alt || name ? `Avatar: ${alt || name}` : undefined}
      className={cn(
        'relative inline-flex items-center justify-center bg-surface-raised font-medium text-fg-secondary overflow-hidden select-none shrink-0 border border-line',
        VARIANTS[variant], sizeClass, className
      )}
      style={sizeStyle}
      {...rest}
    >
      {showImg ? (
        <img
          src={src ?? undefined} alt={alt || name || 'Avatar'} loading="lazy" decoding="async"
          onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
          className={cn('h-full w-full object-cover transition-opacity duration-300', imgLoaded ? 'opacity-100' : 'opacity-0')}
        />
      ) : initials ? (
        <span className="font-semibold uppercase">{initials}</span>
      ) : (
        <Icon name="user" size={iconSize === 16 ? 16 : 24} />
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-surface',
            typeof size === 'number' ? (size < 40 ? 'h-2 w-2' : 'h-3 w-3') : (size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'),
            status in STATUS_COLORS ? STATUS_COLORS[status as keyof typeof STATUS_COLORS] : 'bg-accent-blue'
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

