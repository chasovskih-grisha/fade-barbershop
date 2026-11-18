// Секція «Історія»: журнал подій outbox за візитом і сповіщення за ними
// (REF-ADM-03 «побачити історію змін у тій же панелі»).
'use client';

import { Card, EmptyState } from '@fade/ui';
import { EventRow, NotificationRow } from './booking-journal-rows';
import type { BookingDetail } from './booking-types';

export function BookingHistoryCard({ detail }: { detail: BookingDetail }) {
  return (
    <Card className="p-6">
      <h2 className="mb-3 font-display text-h4">Історія змін</h2>
      {detail.events.length === 0 ? (
        <EmptyState
          title="Подій ще не було"
          description="Журнал з’явиться разом з першою зміною візиту."
        />
      ) : (
        <ul>
          {detail.events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
      {detail.notifications.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <h3 className="text-caption text-fg-muted uppercase">Сповіщення</h3>
          <ul>
            {detail.notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
