'use client';

import type { ExtendedAppointment } from '@/lib/api/appointments';
import { CancelVisitDialog } from './CancelVisitDialog';
import { ReferenceEditDialog } from './ReferenceEditDialog';
import { RescheduleVisitDialog } from './RescheduleVisitDialog';
import type { ReferenceEdit } from './useReferenceEditor';
import type { VisitDialog } from './useAppointmentsPage';

export function AppointmentModals({
  selected,
  dialog,
  busy,
  actionError,
  onClose,
  onCancel,
  onReschedule,
  onReference,
}: {
  selected: ExtendedAppointment | null;
  dialog: VisitDialog;
  busy: boolean;
  actionError: string | null;
  onClose: () => void;
  onCancel: () => void;
  onReschedule: (when: { date: string; start: string; end: string }) => void;
  onReference: (reference: ReferenceEdit) => void;
}) {
  return (
    <>
      <RescheduleVisitDialog
        visit={selected}
        open={dialog === 'reschedule'}
        busy={busy}
        error={actionError}
        onClose={onClose}
        onConfirm={onReschedule}
      />
      <CancelVisitDialog
        visit={selected}
        open={dialog === 'cancel'}
        busy={busy}
        error={actionError}
        onClose={onClose}
        onConfirm={onCancel}
      />
      <ReferenceEditDialog
        visit={selected}
        open={dialog === 'reference'}
        busy={busy}
        error={actionError}
        onClose={onClose}
        onConfirm={onReference}
      />
    </>
  );
}
