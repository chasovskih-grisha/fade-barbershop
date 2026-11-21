'use client';

import { useState, type FormEvent } from 'react';
import { Card, Button, TextField, Badge, AlertBanner } from '@fade/ui';

interface TicketStatus {
  id: string;
  status: 'review' | 'resolved' | 'assigned';
  statusText: string;
  updatedAt: string;
  assignee: string;
}

export function TicketTracker() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<TicketStatus | null>(null);
  const [error, setError] = useState(false);

  const handleTrack = (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    const clean = code.trim().toUpperCase();
    if (clean.includes('TICK') || clean.startsWith('+380') || clean.length >= 6) {
      setResult({
        id: clean.startsWith('TICK') ? clean : `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'review',
        statusText: 'В обробці консьєржем',
        updatedAt: 'Щойно',
        assignee: 'Старший адміністратор FADE Hub',
      });
      setError(false);
    } else {
      setResult(null);
      setError(true);
    }
  };

  return (
    <Card className="p-6 md:p-8 bg-surface-base border border-line space-y-6">
      <div className="max-w-xl space-y-2">
        <Badge tone="info" className="mb-1">
          Моніторинг звернень
        </Badge>
        <h3 className="font-display text-xl font-bold text-text-primary">
          Перевірити статус звернення (Ticket Tracker)
        </h3>
        <p className="text-sm text-text-muted">
          Введіть номер вашого звернення (напр. TICK-1042) або номер телефону, щоб дізнатися
          поточний статус обробки.
        </p>
      </div>

      <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
        <TextField
          id="ticket-tracker-input"
          label=""
          placeholder="Номер звернення або телефон (напр. TICK-1234)..."
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(false);
          }}
          className="flex-1 bg-surface-sunken"
        />
        <Button type="submit" variant="primary" className="text-xs px-6 py-2.5">
          Перевірити статус 🔍
        </Button>
      </form>

      {error && (
        <AlertBanner tone="error" title="Звернення не знайдено">
          Будь ласка, перевірте правильність номера звернення (формат TICK-XXXX) або зверніться до
          Telegram-консьєржа.
        </AlertBanner>
      )}

      {result && (
        <div className="p-4 rounded-lg bg-surface-sunken border border-accent/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-primary text-sm">Звернення: {result.id}</span>
            <Badge tone="success">{result.statusText}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-muted">
            <div>
              Оновлено: <strong className="text-text-primary">{result.updatedAt}</strong>
            </div>
            <div>
              Відповідальний: <strong className="text-text-primary">{result.assignee}</strong>
            </div>
          </div>
          <p className="text-xs text-text-muted pt-1 border-t border-line/50">
            Ваш запит на контролі. Служба підтримки зв’яжеться з вами найближчим часом.
          </p>
        </div>
      )}
    </Card>
  );
}
