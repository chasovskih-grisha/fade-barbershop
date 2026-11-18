'use client';

import { FormEvent } from 'react';
import { Button } from '@fade/ui';

export function ServiceCreateForm({
  name,
  duration,
  parallelDuration,
  category,
  description,
  busy,
  onNameChange,
  onDurationChange,
  onParallelChange,
  onCategoryChange,
  onDescriptionChange,
  onSubmit,
}: {
  name: string;
  duration: number;
  parallelDuration: number | '';
  category: string;
  description: string;
  busy: boolean;
  onNameChange: (v: string) => void;
  onDurationChange: (v: number) => void;
  onParallelChange: (v: number | '') => void;
  onCategoryChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      className="flex flex-wrap items-end gap-3"
      aria-label="Додати послугу"
    >
      <label>
        Назва
        <input
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="mt-1 block rounded-input border border-line p-2"
        />
      </label>
      <label>
        Тривалість, хв
        <input
          required
          type="number"
          min={5}
          max={480}
          value={duration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
          className="mt-1 block rounded-input border border-line p-2"
        />
      </label>
      <label>
        Паралельна, хв
        <input
          type="number"
          min={5}
          max={480}
          value={parallelDuration}
          onChange={(e) => onParallelChange(e.target.value ? Number(e.target.value) : '')}
          className="mt-1 block rounded-input border border-line p-2"
        />
      </label>
      <label>
        Категорія
        <input
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="mt-1 block rounded-input border border-line p-2"
        />
      </label>
      <label>
        Опис
        <input
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="mt-1 block rounded-input border border-line p-2"
        />
      </label>
      <Button type="submit" variant="secondary" size="md" loading={busy}>
        Додати
      </Button>
    </form>
  );
}
