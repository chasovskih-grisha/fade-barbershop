'use client';

import { Button } from '@fade/ui';

interface Props {
  onRetry: () => void;
}

export function LoadError({ onRetry }: Props) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header>
        <h1 className="font-display text-h3">Налаштування · Геокодування</h1>
        <p className="mt-1 text-body text-fg-secondary">
          Провайдер зворотного геокодування для «найближчих локацій» (web-screens §1). Зміна набирає
          чинності одразу.
        </p>
      </header>
      <div className="flex flex-col items-start gap-2 rounded-card border border-line bg-surface-raised p-4">
        <p className="text-body text-fg-secondary">Не вдалося завантажити налаштування.</p>
        <Button variant="secondary" size="md" onClick={onRetry}>
          Спробувати ще раз
        </Button>
      </div>
    </div>
  );
}
