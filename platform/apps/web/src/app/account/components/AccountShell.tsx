'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@fade/ui';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { safeNextPath } from '@/app/login/useLoginActions';

// Клієнтська частина layout-а кабінету: guard по авторизації + навігація розділів.
// Серверний layout (../layout.tsx) відповідає лише за metadata і рендерить цей shell.

const NAV_ITEMS = [
  { label: 'Профіль', href: '/account' },
  { label: 'Мої візити', href: '/account/appointments' },
  { label: 'Пристрої', href: '/account/devices' },
  { label: 'Реферали', href: '/account/referrals' },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      // Тримаємо шлях, який клієнт відкрив: login повертає на нього (T-4718).
      // safeNextPath відкидає зовнішній next, тож у URL не потрапляє чуже.
      const next = safeNextPath(pathname);
      router.push(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return <div className="p-20 text-center text-fg-secondary">Завантаження...</div>;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 md:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-6 md:w-64">
        <div>
          <h2 className="font-display text-h4">{user.name || 'Клієнт'}</h2>
          <p className="text-body-s text-fg-secondary">{user.phone}</p>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Розділи кабінету">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-input px-3 py-2 font-medium transition-colors ${
                  isActive
                    ? 'bg-interactive-active text-fg'
                    : 'text-fg-secondary hover:bg-interactive hover:text-fg'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line pt-4 md:mt-8">
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start text-semantic-danger"
          >
            Вийти
          </Button>
        </div>
      </aside>

      <div className="flex-1">{children}</div>
    </div>
  );
}
