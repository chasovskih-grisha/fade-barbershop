'use client';

import Link from 'next/link';
import { Button, Icon, Sheet } from '@fade/ui';
import { isActivePath, NAV } from './SidebarNav';

/** Мобільний drawer — лише нижче `lg`; на широких екранах `Sheet` повертає null
 *   (open=false), тож overhead — один порожній фрагмент. Стан відкриття живе в
 *   AdminShell, тож drawer не «заховує» контент без участі батьківського фрейму.
 */
export function SidebarDrawer({
  open,
  pathname,
  onNavigate,
  onNewBooking,
}: {
  open: boolean;
  pathname: string;
  onNavigate: () => void;
  onNewBooking: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onNavigate}
      title="Навігація"
      showCloseButton={false}
      description="Розділи адмінки Fade"
    >
      <nav aria-label="Адмін-навігація (мобільний)" className="flex flex-col gap-1">
        {NAV.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            aria-current={isActivePath(pathname, item.path) ? 'page' : undefined}
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-input px-3 py-2 text-body text-fg-secondary hover:bg-interactive hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue aria-[current=page]:bg-interactive aria-[current=page]:font-semibold aria-[current=page]:text-fg"
          >
            <Icon name={item.icon} size={16} className="shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-2 border-t border-line p-3">
        <Button variant="secondary" size="md" onClick={onNewBooking} className="w-full">
          <Icon name="phone" size={16} />
          Новий запис
        </Button>
      </div>
    </Sheet>
  );
}
