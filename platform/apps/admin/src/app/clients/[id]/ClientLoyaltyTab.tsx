'use client';

import { Card, Button } from '@fade/ui';

export function ClientLoyaltyTab({ visitsCount }: { visitsCount: number }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-h4">Лояльність</h2>
        <Button
          variant="secondary"
          size="md"
          onClick={() => alert('Корекція лояльності вимагає API')}
        >
          Скоригувати
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-4xl font-display font-bold text-accent-blue">{visitsCount}</div>
        <div>
          <p className="text-bodyLg text-fg-secondary">з 7 візитів</p>
          <div className="w-64 h-3 bg-surface-raised rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-accent-blue rounded-full transition-all"
              style={{ width: `${Math.min(100, (visitsCount / 7) * 100)}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-4 text-body text-fg-secondary">
        Безкоштовний візит нараховується автоматично після 7 завершених візитів.
      </p>
    </Card>
  );
}
