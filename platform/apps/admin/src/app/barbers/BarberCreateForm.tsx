'use client';

import { FormEvent } from 'react';
import { Button } from '@fade/ui';

export function BarberCreateForm({
  name,
  phone,
  busy,
  onNameChange,
  onPhoneChange,
  onSubmit,
}: {
  name: string;
  phone: string;
  busy: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      className="flex flex-wrap items-end gap-3"
      aria-label="Додати барбера"
    >
      <label>
        Ім’я
        <input
          required
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="mt-1 block rounded-input border border-line p-2"
        />
      </label>
      <label>
        Телефон
        <input
          required
          type="tel"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          className="mt-1 block rounded-input border border-line p-2"
        />
      </label>
      <Button type="submit" variant="secondary" size="md" loading={busy}>
        Додати барбера
      </Button>
    </form>
  );
}
