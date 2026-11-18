'use client';

import { useViewport, breakpointBelow, ADMIN_LG_PX, Icon } from '@fade/ui';

export function useSiteShellBreakpoint() {
  return useViewport();
}

/** Допоміжний пропси/site-shell: «показувати текст іконок» нижче поточного breakpoint без дублювання логіки.
 *   TODO: перекласти через i18n після T-4409 — зараз контракт поки untranslated.
 */
export function useSiteShellNavMode() {
  const { isLarge, breakpoint } = useViewport();
  return {
    showLabels: isLarge,
    burgerVisible: breakpointBelow(breakpoint, ADMIN_LG_PX),
    burgerLabel: 'Відкрити меню', // TODO: перекласти через i18n після T-4409.
  };
}

export function SiteShellNavIcons({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Icon name="menu" size={16} />
    </div>
  );
}
