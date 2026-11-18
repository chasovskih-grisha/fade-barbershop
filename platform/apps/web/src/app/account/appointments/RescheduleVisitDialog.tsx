'use client';

import { Modal } from '@fade/ui';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { RescheduleForm } from './RescheduleForm';

export function RescheduleVisitDialog({
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
  onConfirm: (when: { date: string; start: string; end: string }) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Перенести запис">
      {visit ? (
        <RescheduleForm
          key={`${visit.id}-${visit.date}-${visit.startTime}`}
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
