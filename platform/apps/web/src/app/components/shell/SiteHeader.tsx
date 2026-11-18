import Link from 'next/link';
import { Icon } from '@fade/ui';
import { BOOKING_HREF, NAV_ITEMS } from './nav-items';
import { HeaderAccountLink } from './HeaderAccountLink';
import { MobileNav } from './MobileNav';
import { siteContacts } from '@/lib/site-config';
import { BrandLockup } from './BrandLockup';

// Шапка публічного сайту (web-screens §0): wordmark, навігація, кабінет, CTA.
// Серверний компонент: без клієнтського JS на десктопі; мобільне меню — MobileNav.
// Логотип — кастомний lockup з @fade/brand-assets (згідно з design-system.md §Типографіка).

const linkClass =
  'rounded-input px-2 py-1 text-body text-fg-secondary transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue';

export function SiteHeader() {
  const [phone] = siteContacts();

  return (
    <header className="sticky top-0 z-20 border-b border-line-strong/80 bg-surface-base/90 backdrop-blur-xl shadow-sm">
      <div className="relative mx-auto flex h-16 max-w-container items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center">
          <BrandLockup />
        </Link>

        <nav aria-label="Основна навігація" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {phone && (
            <a
              href={phone.href}
              className="inline-flex items-center gap-1.5 rounded-input px-2 py-1 text-body text-fg-secondary transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            >
              <Icon name="phone" size={16} />
              {phone.value}
            </a>
          )}
          <HeaderAccountLink />
          <Link
            href={BOOKING_HREF}
            className="inline-flex h-11 items-center justify-center rounded-input bg-accent px-4 text-body font-medium text-accent-fg transition-colors hover:bg-fg-secondary"
          >
            Записатися
          </Link>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
