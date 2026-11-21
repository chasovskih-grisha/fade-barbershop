'use client';

import { Button } from '@fade/ui';

export function AddNoteModal({
  noteText,
  noteAuthorRole,
  noteVisibleToClient,
  saving,
  onTextChange,
  onAuthorRoleChange,
  onVisibleChange,
  onCancel,
  onSave,
}: {
  noteText: string;
  noteAuthorRole: 'barber' | 'admin';
  noteVisibleToClient: boolean;
  saving: boolean;
  onTextChange: (value: string) => void;
  onAuthorRoleChange: (role: 'barber' | 'admin') => void;
  onVisibleChange: (visible: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-note-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !saving) {
          onCancel();
        }
      }}
      tabIndex={-1}
    >
      <div className="w-full max-w-md rounded-card bg-surface-base p-6 outline-none focus:outline-none">
        <h2 id="add-note-title" className="font-display text-h4 mb-4">
          Додати нотатку
        </h2>
        <textarea
          value={noteText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Текст нотатки..."
          className="w-full rounded-input border border-line bg-surface-base px-3 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue resize-none"
          rows={4}
          autoFocus
        />
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="authorRole"
              value="admin"
              checked={noteAuthorRole === 'admin'}
              onChange={() => onAuthorRoleChange('admin')}
              className="accent-accent-blue"
            />
            <span className="text-body">Від адміна</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="authorRole"
              value="barber"
              checked={noteAuthorRole === 'barber'}
              onChange={() => onAuthorRoleChange('barber')}
              className="accent-accent-blue"
            />
            <span className="text-body">Від барбера</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={noteVisibleToClient}
              onChange={(e) => onVisibleChange(e.target.checked)}
              className="accent-accent-blue"
            />
            <span className="text-body">Видно клієнту</span>
          </label>
        </div>
        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Скасувати
          </Button>
          <Button onClick={onSave} disabled={saving || !noteText.trim()}>
            {saving ? 'Збереження…' : 'Зберегти'}
          </Button>
        </div>
      </div>
    </div>
  );
}
