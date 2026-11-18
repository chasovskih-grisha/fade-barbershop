'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@fade/ui';

export interface FunnelTelemetryEvent {
  id: string;
  stepName: string;
  clientName: string;
  locationName: string;
  timestamp: string;
  status: 'success' | 'abandoned' | 'step-completed';
}

export function AnalyticsFunnelLiveStream() {
  const [events, setEvents] = useState<FunnelTelemetryEvent[]>([
    { id: '1', stepName: 'Вибір часу (Slot Selection)', clientName: 'Олександр М.', locationName: 'FADE Central (Хрещатик)', timestamp: 'Щойно', status: 'abandoned' },
    { id: '2', stepName: 'Підтвердження платежу', clientName: 'Дмитро К.', locationName: 'FADE Podil (Сагайдачного)', timestamp: '1 хв тому', status: 'success' },
    { id: '3', stepName: 'Вибір послуги', clientName: 'Максим В.', locationName: 'FADE Pechersk (Лексеїча)', timestamp: '3 хв тому', status: 'step-completed' },
  ]);

  const [isLivePaused, setIsLivePaused] = useState(false);

  useEffect(() => {
    if (isLivePaused) return;
    const interval = setInterval(() => {
      const names = ['Андрій Т.', 'Євгеній П.', 'Сергій Б.', 'Артем Л.', 'Володимир С.'];
      const steps = ['Початок бронювання', 'Вибір послуги', 'Вибір майстра', 'Вибір часу (Slot Selection)', 'Підтвердження'];
      const locations = ['FADE Central (Хрещатик)', 'FADE Podil (Сагайдачного)', 'FADE Pechersk'];
      const statuses: Array<'success' | 'abandoned' | 'step-completed'> = ['success', 'abandoned', 'step-completed'];

      const newEvent: FunnelTelemetryEvent = {
        id: Date.now().toString(),
        stepName: steps[Math.floor(Math.random() * steps.length)] ?? 'Вибір послуги',
        clientName: names[Math.floor(Math.random() * names.length)] ?? 'Клієнт',
        locationName: locations[Math.floor(Math.random() * locations.length)] ?? 'FADE Central',
        timestamp: 'Щойно',
        status: statuses[Math.floor(Math.random() * statuses.length)] ?? 'step-completed',
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 5)]);
    }, 6000);

    return () => clearInterval(interval);
  }, [isLivePaused]);

  return (
    <Card className="p-6 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-semantic-success animate-pulse" />
            <h3 className="font-display text-h4 font-bold text-fg">Потоковий моніторинг телеметрії воронок (ANL-LIVE-03)</h3>
          </div>
          <p className="text-body text-fg-muted">Реєстрація подій поведінкової воронки бронювання в реальному часі</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLivePaused(!isLivePaused)}
            className="rounded-input border border-border bg-surface px-3 py-1.5 text-body-sm font-medium text-fg hover:bg-surface-raised transition-colors"
          >
            {isLivePaused ? '▶ Продовжити потік' : '⏸ Пауза потоку'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {events.map((ev) => (
          <div key={ev.id} className="p-3 rounded-input border border-line bg-surface flex items-center justify-between text-body">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${
                ev.status === 'success' ? 'bg-semantic-success' : ev.status === 'abandoned' ? 'bg-semantic-danger' : 'bg-accent'
              }`} />
              <div className="flex flex-col">
                <span className="font-semibold text-fg">{ev.stepName}</span>
                <span className="text-caption text-fg-muted">{ev.clientName} • {ev.locationName}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 rounded-pill text-caption font-semibold ${
                ev.status === 'success' ? 'bg-semantic-success/10 text-semantic-success' :
                ev.status === 'abandoned' ? 'bg-semantic-danger/10 text-semantic-danger' :
                'bg-accent/10 text-accent'
              }`}>
                {ev.status === 'success' ? 'Успіх' : ev.status === 'abandoned' ? 'Кинуто кошик' : 'Крок пройдено'}
              </span>
              <span className="text-caption text-fg-secondary">{ev.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
