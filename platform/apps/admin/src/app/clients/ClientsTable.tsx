'use client';

// Таблиця клієнтів (T-4606a, admin-screens §6.1): колонки Ім’я | Телефон |
// Візитів | Останній візит | Лояльність (3/7) | VIP | Дії. Сортування
// КЕРОВАНЕ: стан живе в URL сторінки, таблиця тільки кликає onSort і рендерить
// порядок від сервера (клік по рядку теж відкриває картку клієнта).
import type { MouseEvent } from 'react';
import { Badge, Button, Table, THead, TBody, TR, TH, TD } from '@fade/ui';
import { useRouter } from 'next/navigation';
import { SortableTh } from '../components/SortableTh';
import { phoneBookingPath } from './phone-booking-path';
import type { ClientListItem } from './client-list-types';

export const LOYALTY_TARGET = 7;

/** ISO → DD.MM.YYYY без таймзон (сервер віддає UTC; рядок не парсимо в Date). */
const formatDate = (iso: string | null): string =>
  iso ? iso.slice(0, 10).split('-').reverse().join('.') : '—';

export function ClientsTable({
  clients,
  sort,
  onSort,
  onOpen,
}: {
  clients: ClientListItem[];
  sort: { key: string; dir: 'asc' | 'desc' };
  onSort: (key: string) => void;
  onOpen: (id: string) => void;
}) {
  const router = useRouter();
  const click = (handler: () => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler();
  };

  return (
    <Table>
      <THead>
        <TR>
          <SortableTh column="name" label="Ім’я" sort={sort} onSort={onSort} />
          <SortableTh column="phone" label="Телефон" sort={sort} onSort={onSort} />
          <SortableTh column="visits" label="Візитів" sort={sort} onSort={onSort} />
          <SortableTh column="lastVisit" label="Останній візит" sort={sort} onSort={onSort} />
          <SortableTh column="loyalty" label="Лояльність" sort={sort} onSort={onSort} />
          <SortableTh column="vip" label="VIP" sort={sort} onSort={onSort} />
          <TH>Дії</TH>
        </TR>
      </THead>
      <TBody>
        {clients.map((client) => (
          <TR key={client.id} onClick={() => onOpen(client.id)}>
            <TD>{client.name ?? '—'}</TD>
            <TD>{client.phone}</TD>
            <TD>{client.visits}</TD>
            <TD>{formatDate(client.lastVisit)}</TD>
            <TD>
              <Badge tone="info">
                {client.loyaltyVisits}/{LOYALTY_TARGET}
              </Badge>
            </TD>
            <TD>
              {client.vipDiscountPercent ? (
                <Badge tone="success">{client.vipDiscountPercent}%</Badge>
              ) : (
                <span className="text-fg-secondary">—</span>
              )}
            </TD>
            <TD>
              <div className="flex gap-1">
                <Button variant="ghost" size="md" onClick={click(() => onOpen(client.id))}>
                  Відкрити
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={click(() => router.push(phoneBookingPath(client)))}
                >
                  Записати
                </Button>
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
