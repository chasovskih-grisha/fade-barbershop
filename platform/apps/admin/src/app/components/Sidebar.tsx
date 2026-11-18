'use client';

import { Badge, Button, Icon } from '@fade/ui';
import { Wordmark } from './BrandWordmark';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarDrawer } from './sidebar-drawer';
import { isActivePath, NAV } from './SidebarNav';
import { breakpointBelow, ADMIN_LG_PX, useViewport } from '@fade/ui';

/** Sidebar — адаптивна навігація адмінки: іконки на вузьких екранах,
 *   повні назви `lg` і вище, мобільний drawer через Sheet.
 *   Стан відкриття винесено в AdminShell, тож drawer не «заховує» контент
 *   без участі батьківського фрейму.
 */
export default function Sidebar(props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  narrow?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { open, onOpenChange, narrow: parentNarrow } = props;
  const { breakpoint } = useViewport();
  const narrow = parentNarrow ?? breakpointBelow(breakpoint, ADMIN_LG_PX);
  const wasPreviouslyNarrow = useRef(narrow);

  // Закриття drawer, коли вікно стає достатньо широким (наприклад, під час
  // resize в тестах або на живому сайті). Sidebar сам закриває drawer,
  // коли вікно стало широким і коли не керується ззовні через `parentNarrow`.
  // Коли breakpoint змінюється, narrow також змінюється — тому ефект
  // спрацьовує і закриває drawer.
  useEffect(() => {
    if (parentNarrow === undefined && !narrow && wasPreviouslyNarrow.current) {
      onOpenChange?.(false);
    }
    wasPreviouslyNarrow.current = narrow;
  }, [breakpoint, narrow, parentNarrow, onOpenChange]);

  return (
    <>
      <SidebarDrawer
        open={Boolean(narrow && open)}
        pathname={pathname}
        onNavigate={() => onOpenChange?.(false)}
        onNewBooking={() => {
          router.push('/bookings/phone');
          onOpenChange?.(false);
        }}
      />

      {/* Постійний сайдбар — завжди присутній, але на вузьких екранах показує
       *   лише іконки (прибираємо текст і зайвий відступ). */}
      <aside
        data-testid="sidebar"
        className={
          narrow
            ? 'flex flex-col items-start gap-1 border-r border-line bg-surface-raised p-2'
            : 'flex flex-col items-start gap-1 border-r border-line bg-surface-raised p-2 lg:w-52 lg:items-stretch lg:px-3'
        }
        aria-label="Адмін-навігація"
      >
        <div className="flex items-center border-r border-line">
          <span className="shrink-0 border-r border-line bg-interactive/40 px-2 py-1">
            <Icon name="check" size={16} aria-hidden="true" />
          </span>
          <Wordmark
            className={
              narrow
                ? 'sr-only lg:inline-flex lg:items-center lg:gap-2 lg:px-2 lg:py-1'
                : 'inline-flex items-center gap-2 px-2 py-1 lg:px-3 lg:py-2'
            }
            title="Fade · Admin"
          />
        </div>
        <nav aria-label="Адмін-панель" className="flex flex-col gap-1 w-full">
          {NAV.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActivePath(pathname, item.path) ? 'page' : undefined}
              title={item.label}
              className={`flex items-center gap-2 rounded-input min-w-0 overflow-hidden px-2.5 py-2 text-body text-fg-secondary hover:bg-interactive hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue aria-[current=page]:bg-interactive aria-[current=page]:font-semibold aria-[current=page]:text-fg${narrow ? '' : ' lg:px-3'}`}
            >
              <Icon name={item.icon} size={16} className="shrink-0" />
              <span className="truncate text-body text-fg hidden whitespace-nowrap sm:block lg:inline">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col items-stretch gap-2 px-1 py-2 lg:px-3">
          <Badge tone="accent" className="mx-auto w-fit hidden sm:block">
            AI
          </Badge>
          <Button
            variant="secondary"
            size="md"
            aria-label="Новий запис"
            onClick={() => router.push('/bookings/phone')}
            className="w-full lg:w-auto lg:gap-2"
          >
            <Icon name="phone" size={16} className="shrink-0" />
            <span className="hidden sm:inline">Новий запис</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
