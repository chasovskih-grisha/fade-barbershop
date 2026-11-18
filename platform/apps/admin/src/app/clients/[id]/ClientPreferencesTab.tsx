'use client';

import { Card, Button, EmptyState } from '@fade/ui';
import type { ClientPreference } from './client-types';

export function ClientPreferencesTab({ preferences }: { preferences: ClientPreference[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-h4">Вподобання</h2>
        <Button
          variant="secondary"
          size="md"
          onClick={() => alert('Редагування вподобань вимагає API')}
        >
          Редагувати
        </Button>
      </div>
      {preferences.length === 0 ? (
        <EmptyState title="Вподобань немає" description="Клієнт ще не додав вподобань." />
      ) : (
        <ul className="space-y-2">
          {preferences.map((pref) => (
            <li
              key={pref.id}
              className="flex items-center justify-between p-3 rounded-card border border-line bg-surface-raised"
            >
              <span className="text-body">{pref.text}</span>
              <span className="text-caption text-fg-secondary">
                {new Date(pref.createdAt).toLocaleDateString('uk-UA')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
