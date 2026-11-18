import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { OfflineBanner } from '../states/OfflineBanner';

// Публічний web-shell (T-4508, design-system.md §Shells): шапка + вміст + футер.
// Один каркас для всіх сторінок sites; сторінки не будують навігацію самі.
// Офлайн-стан живе тут (T-4513), бо це властивість сесії гостя, а не сторінки.

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-base">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-input focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-body focus:font-medium focus:text-fg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
      >
        Перейти до основного вмісту
      </a>
      <SiteHeader />
      <OfflineBanner />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
