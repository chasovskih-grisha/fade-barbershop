'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { Avatar, Button, Icon } from '@fade/ui';
import { BOOKING_HREF, NAV_ITEMS } from './nav-items';
import { useAccountControl } from './useAccountControl';

// Мобільне меню (web-screens §0): список навігації + CTA. Розкриття без JS неможливе,
// тому стан клієнтський; Escape і клік по пункту закривають меню, aria-expanded тримає
// семантику disclosure. Десктопний варіант — у SiteHeader (без клієнтського JS).

export function MobileNav({ bookingOpen = true }: { bookingOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const account = useAccountControl();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="md"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Закрити меню' : 'Відкрити меню'}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={open ? 'close' : 'menu'} size={24} />
      </Button>

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full z-20 border-b border-line bg-surface-raised"
        >
          <nav
            aria-label="Мобільна навігація"
            className="mx-auto flex max-w-container flex-col px-4 py-2"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3 text-bodyLg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 py-3">
              <Link
                href={account.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-body text-fg-secondary"
              >
                {account.signedIn ? (
                  <Avatar {...(account.name ? { name: account.name } : {})} size="sm" aria-hidden />
                ) : (
                  <Icon name="user" size={16} />
                )}
                {account.label}
              </Link>
              {bookingOpen && (
                <Link
                  href={BOOKING_HREF}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-input bg-accent px-4 py-3 font-medium text-accent-fg"
                >
                  Записатися
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
