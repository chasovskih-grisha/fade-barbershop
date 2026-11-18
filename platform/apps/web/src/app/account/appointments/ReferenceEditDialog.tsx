'use client';

// Діалог редагування референсу/коментаря в «Моїх візитах» (T-043, REF-WEB-04).
// Форма — у ReferenceEditForm (LOC-гейт ADR 0019); key на id візиті перезапускає
// стан редагування при переході на інший запис.
import { Modal } from '@fade/ui';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { ReferenceEditForm } from './ReferenceEditForm';
import type { ReferenceEdit } from './useReferenceEditor';

export function ReferenceEditDialog({
  visit,
  open,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  visit: ExtendedAppointment | null;
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (reference: ReferenceEdit) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Референс і коментар">
      {visit ? (
        <ReferenceEditForm
          key={visit.id}
          visit={visit}
          busy={busy}
          error={error}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </Modal>
  );
}
