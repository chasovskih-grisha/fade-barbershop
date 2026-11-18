import tokens from '@fade/design-tokens/tokens.json';
import { iconPaths, type IconName } from './icons';
import { cn } from './cn';

// Компонент `Icon` — T-4506. Один набір, сітка 24px, stroke 1.5–2 (design-system.md).
// Розмір і stroke беруться з токенів, колір — currentColor (успадковує текстовий
// колір токенів на місці виклику). Декоративна іконка за замовчуванням aria-hidden.

const GRID = tokens.icons.grid.value;
const DEFAULT_STROKE = tokens.icons.stroke.min;

// Розміри — значення зі шкали токенів (spacing: 4/8/12/16/24/32/48/64).
const SIZES = { 16: 'h-4 w-4', 24: 'h-6 w-6' } as const;
export type IconSize = keyof typeof SIZES;

export interface IconProps {
  name: IconName;
  /** Розмір за шкалою токенів; 24 — базова сітка. */
  size?: IconSize;
  /** 1.5–2 (design-system.md); за замовчуванням — мінімум діапазону. */
  strokeWidth?: number;
  /** Непорожній label робить іконку доступною: role="img" + aria-label. */
  label?: string;
  className?: string;
}

export function Icon({
  name,
  size = 24,
  strokeWidth = DEFAULT_STROKE,
  label,
  className,
}: IconProps) {
  const decorative = !label;
  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      width={GRID}
      height={GRID}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={label}
      focusable="false"
      className={cn('shrink-0', SIZES[size], className)}
    >
      {iconPaths[name]}
    </svg>
  );
}
