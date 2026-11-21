'use client';

import { useState } from 'react';
import { Card, Button, TextField, Badge, AlertBanner } from '@fade/ui';

export function CallbackWidget() {
  const [phone, setPhone] = useState('');
  const [requested, setRequested] = useState(false);

  return (
    <Card className="p-6 md:p-8 bg-surface-base border border-line space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <Badge tone="success" className="mb-1">
            Live • Статус черги
          </Badge>
          <h3 className="font-display text-xl font-bold text-text-primary">
            Експрес-дзвінок адміністратору
          </h3>
          <p className="text-xs text-text-muted">
            Поточна завантаженість:{' '}
            <span className="text-success font-medium">вільні місця є (очікування &lt; 5 хв)</span>.
            Замовте швидкий дзвінок:
          </p>
        </div>
      </div>

      {requested ? (
        <AlertBanner tone="success" title="Запит на зворотний дзвінок прийнято!">
          Адміністратор зв’яжеться з вами за номером {phone} протягом 5 хвилин.
        </AlertBanner>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!phone.trim()) return;
            setRequested(true);
          }}
          className="flex flex-col sm:flex-row gap-2 pt-2"
        >
          <TextField
            id="instant-callback-phone"
            label=""
            placeholder="Введіть ваш телефон (+380...)"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="flex-1 bg-surface-sunken"
          />
          <Button type="submit" variant="primary" className="text-xs px-6 py-2.5">
            Передзвонити мені 📞
          </Button>
        </form>
      )}
    </Card>
  );
}
