import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@fade/ui';

// CTA-посилання у вигляді кнопки — спільне для публічних сторінок (T-4513):
// клас кнопки з токенів був продубльований на кожній сторінці, тож «Далеко»
// на екранах порожнього стану та помилки тягнуло за собою четверту копію.

const VARIANTS = {
  primary: 'bg-accent text-accent-fg hover:bg-fg-secondary',
  secondary: 'border border-line bg-transparent text-fg hover:bg-interactive',
} as const;

export function ActionLink({
  href,
  children,
  variant = 'primary',
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-12 items-center justify-center rounded-input px-5 font-text text-bodyLg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
