'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@fade/ui';
import { sidebarNavItems } from './sidebar-nav';
import { useEffect, useState } from 'react';

/** Навігація адмінки — один файл, що експортує NAV (для Sidebar) і
 *   isActivePath, щоб не створювати окремий util-файл для двох функцій.
 *
 *   Сховано в SidebarNav, бо це загальний опис маршрутів адмінки — зручніше
 *   редагувати в одному місці, ніж розсипати по файлах.
 */
export { sidebarNavItems as NAV };

export function isActivePath(pathname: string, link: string): boolean {
  if (!link || link === '/') return pathname === '/';
  return (
    pathname === link ||
    pathname.startsWith(link + '/') ||
    (link !== '/' && pathname.startsWith(link) && pathname[link.length] === '/')
  );
}
export default function SidebarNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('admin');

  useEffect(() => {
    fetch('/admin/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.role) setRole(data.role);
      })
      .catch(() => {});
  }, []);

  const filteredItems = sidebarNavItems.filter((item) => {
    if (role === 'barber') {
      return ['/', '/clients', '/visits'].includes(item.path);
    }
    if (role === 'manager' || role === 'location_manager') {
      return [
        '/',
        '/locations',
        '/clients',
        '/analytics',
        '/visits',
        '/bookings/phone',
        '/services',
        '/barbers',
      ].includes(item.path);
    }
    return true;
  });

  return (
    <nav aria-label="Адмін-панель" className="flex flex-col gap-1 w-full">
      {filteredItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          aria-current={isActivePath(pathname, item.path) ? 'page' : undefined}
          title={item.label}
          className="flex items-center gap-2 rounded-input min-w-0 overflow-hidden px-2.5 py-2 text-body text-fg-secondary hover:bg-interactive hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue aria-[current=page]:bg-interactive aria-[current=page]:font-semibold aria-[current=page]:text-fg"
        >
          <Icon name={item.icon} size={16} className="shrink-0" />
          <span className="truncate text-body text-fg hidden whitespace-nowrap sm:block lg:inline">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
