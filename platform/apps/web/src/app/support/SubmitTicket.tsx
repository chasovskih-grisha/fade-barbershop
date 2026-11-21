'use client';

import { useState, type FormEvent } from 'react';
import { Card, Button, TextField, AlertBanner } from '@fade/ui';

const EMPTY_FORM = { name: '', phone: '', message: '' };

export function SubmitTicket() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.phone || !form.message) return;
    setSubmitted(true);
  };

  return (
    <Card className="p-6 md:p-8 bg-surface-sunken border border-line space-y-6">
      <div className="max-w-xl space-y-2">
        <h3 className="font-display text-xl font-bold text-text-primary">
          Потрібна індивідуальна допомога?
        </h3>
        <p className="text-sm text-text-muted">
          Залиште своє звернення, і наша служба підтримки зв’яжеться з вами протягом 15 хвилин у
          робочий час.
        </p>
      </div>

      {submitted ? (
        <AlertBanner tone="success" title="Звернення успішно надіслано!">
          Ми отримали ваш запит і невдовзі зателефонуємо на вказаний номер телефону. Дякуємо, що ви
          з FADE.
        </AlertBanner>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <TextField
              id="ticket-name"
              label="Ваше ім’я"
              placeholder="Введіть ваше ім’я"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <TextField
              id="ticket-phone"
              label="Номер телефону *"
              placeholder="+380 (XX) XXX-XX-XX"
              required
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <label
                htmlFor="ticket-message"
                className="block text-xs font-medium text-text-primary mb-1"
              >
                Опишіть вашу ситуацію або питання *
              </label>
              <textarea
                id="ticket-message"
                rows={4}
                required
                placeholder="Опишіть вашу ситуацію або питання..."
                className="w-full rounded-[var(--radius-input)] border border-line bg-surface-base p-3 text-sm font-text text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none"
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
              />
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Надіслати звернення
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
