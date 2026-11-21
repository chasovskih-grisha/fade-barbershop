'use client';

import { Button, Icon } from '@fade/ui';
import { useOffline } from './offline-context';

export default function OfflineStatusBar() {
  const { isOnline, outboxQueue, syncStatus, triggerSync } = useOffline();

  if (isOnline && outboxQueue.length === 0) return null;

  const label = !isOnline
    ? `Режим офлайн. Черга синхронізації: ${outboxQueue.length} змін.`
    : syncStatus === 'syncing'
      ? 'Синхронізація змін із сервером...'
      : `Онлайн. Очікують синхронізації: ${outboxQueue.length} змін.`;

  return (
    <div
      role="status"
      aria-label="Статус підключення та синхронізації"
      className={`flex items-center justify-between px-4 py-2 text-sm font-medium ${
        !isOnline ? 'bg-semantic-warning text-slate-950' : 'bg-blue-600 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon name={!isOnline ? 'alert' : 'info'} size={16} />
        <span>{label}</span>
      </div>
      {outboxQueue.length > 0 && isOnline ? (
        <Button
          variant="secondary"
          onClick={() => void triggerSync()}
          className="text-xs bg-white text-fg hover:bg-interactive-hover px-2.5 py-1 h-auto"
        >
          Синхронізувати зараз
        </Button>
      ) : null}
    </div>
  );
}
