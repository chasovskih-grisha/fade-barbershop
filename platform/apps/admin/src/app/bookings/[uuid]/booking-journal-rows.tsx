// Рядки журналу візиту: подія outbox (підпис, статус, актор, деталі) і
// сповіщення за нею. Окремо від картки, щоб і картка, і рядки лишались
// простими (LOC/complexity-гейт, ADR 0019).
'use client';

import { Badge } from '@fade/ui';
import { time } from './booking-format';
import { EVENT_STATUS_LABELS, NOTIFICATION_STATUS_LABELS } from './booking-labels';
import type { BookingEventView, BookingNotificationView } from './booking-types';

const failed = (status: string) => status === 'failed';

export function EventRow({ event }: { event: BookingEventView }) {
  return (
    <li className="border-b border-line py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body font-medium">{event.label}</span>
        <Badge tone={failed(event.status) ? 'danger' : 'neutral'}>
          {EVENT_STATUS_LABELS[event.status] ?? event.status}
        </Badge>
        <span className="ml-auto text-caption text-fg-muted">{time(event.occurredAt)}</span>
      </div>
      {event.actor && <p className="mt-1 text-caption text-fg-muted">{`Актор: ${event.actor}`}</p>}
      {event.details.map((line) => (
        <p key={line} className="mt-1 text-body text-fg-secondary">
          {line}
        </p>
      ))}
    </li>
  );
}

export function NotificationRow({ notification }: { notification: BookingNotificationView }) {
  return (
    <li className="mt-2 flex flex-wrap items-center gap-2 text-body text-fg-secondary">
      <span className="text-fg-muted">{time(notification.sentAt)}</span>
      <Badge tone={failed(notification.status) ? 'danger' : 'neutral'}>
        {NOTIFICATION_STATUS_LABELS[notification.status] ?? notification.status}
      </Badge>
      <span>{`${notification.channel} → ${notification.recipient}`}</span>
      {notification.subject && <span className="text-fg-muted">{notification.subject}</span>}
      {notification.detail && <span className="text-fg-muted">{notification.detail}</span>}
    </li>
  );
}
