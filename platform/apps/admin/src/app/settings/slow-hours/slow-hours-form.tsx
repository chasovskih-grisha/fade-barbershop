'use client';

// T-4464: Форма порогів «слабких годин». Валідація — локальна і явна,
// без зовнішніх бібліотек форм, бо значення — лише цілі числа в діапазоні.
import { useState } from 'react';
import { AlertBanner, Button, TextField } from '@fade/ui';

const FIELDS = [
  { key: 'windowDays', label: 'Вікно аналізу (днів)', min: 1, max: 60 },
  { key: 'thresholdPercent', label: 'Поріг заповненості (%)', min: 1, max: 100 },
  { key: 'openHour', label: 'Початок робочого дня (година)', min: 0, max: 23 },
  { key: 'closeHour', label: 'Кінець робочого дня (година)', min: 1, max: 24 },
  { key: 'chairs', label: 'Кількість крісел', min: 1, max: 50 },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];
type Values = Record<FieldKey, number>;

const INITIAL: Values = {
  windowDays: 14,
  thresholdPercent: 40,
  openHour: 9,
  closeHour: 21,
  chairs: 2,
};

function isInvalid(min: number, max: number, value: number): boolean {
  return !Number.isInteger(value) || value < min || value > max;
}

function firstError(values: Values): string | null {
  const invalid = FIELDS.find((field) => isInvalid(field.min, field.max, values[field.key]));
  return invalid
    ? `${invalid.label}: допустиме значення від ${invalid.min} до ${invalid.max}`
    : null;
}

export default function SlowHoursForm({ onSaved }: { onSaved: () => void }) {
  const [values, setValues] = useState<Values>(INITIAL);
  const [error, setError] = useState<string | null>(null);

  const change = (key: FieldKey, raw: string): void => {
    setValues((current) => ({ ...current, [key]: Number(raw) }));
    setError(null);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const failure = firstError(values);
    if (failure) {
      setError(failure);
      return;
    }
    onSaved();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Налаштування слабких годин">
      {FIELDS.map((field) => (
        <TextField
          key={field.key}
          label={field.label}
          type="number"
          min={field.min}
          max={field.max}
          step={1}
          value={values[field.key]}
          onChange={(event) => change(field.key, event.target.value)}
        />
      ))}
      {error ? (
        <AlertBanner tone="error" title="Помилка">
          {error}
        </AlertBanner>
      ) : null}
      <Button type="submit" className="w-full">
        Зберегти налаштування
      </Button>
    </form>
  );
}
