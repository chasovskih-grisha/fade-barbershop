'use client';

import { TextField } from '@fade/ui';

interface BarberSearchProps {
  value: string;
  onChange: (query: string) => void;
}

/** T-4857a: labeled field that finds a barber by name; clearing restores the groups. */
export function BarberSearch({ value, onChange }: BarberSearchProps) {
  return (
    <div className="flex min-w-[260px] items-end gap-2">
      <TextField
        label="Знайти майстра"
        type="search"
        placeholder="Ім'я майстра"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="h-11 rounded-input border border-line px-3 text-caption font-semibold text-fg-secondary transition-colors hover:text-fg cursor-pointer"
        >
          Очистити
        </button>
      )}
    </div>
  );
}
