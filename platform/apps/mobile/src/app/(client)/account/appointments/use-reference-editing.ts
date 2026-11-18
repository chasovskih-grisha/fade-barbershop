import { useCallback, useState } from 'react';
import { ApiError, setAppointmentReference } from '../../../../lib/api/appointments';
import type { ReferenceEdit } from './use-reference-editor';

/** 409 — серверний замок: візит уже підтверджено барбером (REF-WEB-04). */
const LOCKED = 'Майстер уже підтвердив запис — редагування недоступне';
const SAVE_FAILED = 'Не вдалося зберегти зміни. Спробуйте пізніше.';

function reason(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) return LOCKED;
  return error instanceof Error ? error.message : SAVE_FAILED;
}

/**
 * Хто з візитів зараз редагується + команда збереження (REF-MOB-02).
 * Право редагування вирішує сервер: клієнт лише показує форму, коли
 * `canEditReference`, а замок після підтвердження приходить як 409.
 */
export function useReferenceEditing(reload: () => Promise<void>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback((id: string) => {
    setError(null);
    setEditingId(id);
  }, []);

  const close = useCallback(() => {
    setEditingId(null);
    setError(null);
  }, []);

  const save = useCallback(
    async (id: string, edit: ReferenceEdit) => {
      setBusy(true);
      setError(null);
      try {
        await setAppointmentReference(id, edit);
        setEditingId(null);
        await reload();
      } catch (err) {
        setError(reason(err));
      } finally {
        setBusy(false);
      }
    },
    [reload]
  );

  return { editingId, busy, error, open, close, save };
}
