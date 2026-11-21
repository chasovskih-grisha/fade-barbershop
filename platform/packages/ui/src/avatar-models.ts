// Модель і похідні значення для Avatar: окремий модуль, щоб компонент
// лишався в межах ADR 0019 і містив тільки рендер.

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
} as const;
export type AvatarSize = keyof typeof SIZES | number;

const VARIANTS = { round: 'rounded-full', square: 'rounded-lg' } as const;
export type AvatarVariant = keyof typeof VARIANTS;

const STATUS_COLORS = {
  online: 'bg-semantic-success',
  offline: 'bg-fg-muted',
  busy: 'bg-semantic-danger',
  away: 'bg-semantic-warning',
} as const;
export type AvatarStatus = keyof typeof STATUS_COLORS | string;

export { VARIANTS };

export function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 && parts[0] && parts[1]
    ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    : parts[0]
      ? parts[0].slice(0, 2).toUpperCase()
      : '';
}

export function getSizeStyle(size: AvatarSize) {
  return typeof size === 'number' ? { width: size, height: size } : undefined;
}

export function getSizeClass(size: AvatarSize) {
  return typeof size === 'string' && size in SIZES ? SIZES[size as keyof typeof SIZES] : undefined;
}

export function getIconSize(size: AvatarSize): 16 | 24 {
  if (typeof size === 'number') return size < 36 ? 16 : 24;
  return size === 'sm' ? 16 : 24;
}

export function getStatusDotClass(size: AvatarSize, status: AvatarStatus): string {
  const dotSize =
    typeof size === 'number'
      ? size < 40
        ? 'h-2 w-2'
        : 'h-3 w-3'
      : size === 'sm'
        ? 'h-2 w-2'
        : 'h-3 w-3';
  const color =
    status in STATUS_COLORS
      ? STATUS_COLORS[status as keyof typeof STATUS_COLORS]
      : 'bg-accent-blue';
  return `absolute bottom-0 right-0 block rounded-full ring-2 ring-surface ${dotSize} ${color}`;
}
