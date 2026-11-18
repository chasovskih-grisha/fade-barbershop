'use client';

import { Card, Badge, Button, EmptyState } from '@fade/ui';
import type { ClientNote } from './client-types';

export function ClientNotesTab({
  notes,
  onAdd,
  onRemove,
}: {
  notes: ClientNote[];
  onAdd: () => void;
  onRemove: (noteId: string) => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-h4">Нотатки</h2>
        <Button onClick={onAdd}>Додати нотатку</Button>
      </div>
      {notes.length === 0 ? (
        <EmptyState title="Нотаток немає" description="Додайте першу нотатку для клієнта." />
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="p-4 rounded-card border border-line bg-surface-raised">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-body">{note.text}</p>
                  <div className="flex items-center gap-3 mt-2 text-caption text-fg-secondary">
                    <span>{note.authorRole === 'barber' ? 'Барбер' : 'Адмін'}</span>
                    <span>•</span>
                    <span>{new Date(note.createdAt).toLocaleDateString('uk-UA')}</span>
                    {note.visibleToClient && <Badge tone="info">Видно клієнту</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="md" onClick={() => onRemove(note.id)}>
                  Видалити
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
