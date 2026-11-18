'use client';

import type { ClientSession, ClientSessionChannel } from '@fade/contracts';
import { Badge, Card } from '@fade/ui';

const CHANNEL_LABEL: Record<ClientSessionChannel, string> = {
  web: 'Вебсайт',
  mobile: 'Мобільний застосунок',
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long', timeStyle: 'short' }).format(
    new Date(iso)
  );
}

/** Список активних пристроїв: канал, час входу і позначка поточної сесії. */
export function DeviceList({ sessions }: { sessions: ClientSession[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((session) => (
        <li key={session.id}>
          <Card className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-body text-fg">{CHANNEL_LABEL[session.channel]}</span>
              <span className="text-caption text-fg-muted">
                Вхід: {formatDate(session.createdAt)}
              </span>
            </div>
            {session.current ? <Badge tone="accent">Цей пристрій</Badge> : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}
