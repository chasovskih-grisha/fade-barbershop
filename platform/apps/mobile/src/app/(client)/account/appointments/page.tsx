/* eslint-disable max-lines */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import {
  getAppointments,
  rescheduleAppointment,
  cancelAppointment,
} from '../../../../lib/api/appointments';
import { AppointmentRow } from './list-item';
import type { StatusFilter } from './status-filter';
import { VisitsBody } from './visits-body';
import { makeClientAppointments } from './fixtures';
import { useReferenceEditing } from './use-reference-editing';
import { RescheduleModal } from './reschedule-modal';
import { CancelModal } from './cancel-modal';

/**
 * Mobile cabinet screen: list of client appointments from
 * `GET /booking/appointments`. Statuses are the shared `CabinetStatus`,
 * derived through `CABINET_STATUS` (see `lib/api/appointments.ts`), so the
 * enums match the web cabinet exactly. Two sections: «Майбутні» / «Минулі».
 * Includes reference editing, rescheduling, and cancellation (T-4740).
 */
export function MyVisitsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>(() =>
    makeClientAppointments()
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [reschedulingApp, setReschedulingApp] = useState<ExtendedAppointment | null>(null);
  const [cancellingApp, setCancellingApp] = useState<ExtendedAppointment | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // `quiet` — оновлення після збереження референсу: список не має блимати
  // скелетоном, але помилка тихо не ковтається.
  const load = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      setError(null);
      setAppointments(await getAppointments());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити візити');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => load(true), [load]);

  // Редагування референсу/коментаря (REF-MOB-02, правило REF-WEB-04):
  // форму показуємо лише тому візиту, який відкрито, і лише коли сервер
  // дозволив редагування (`canEditReference`).
  const editing = useReferenceEditing(reload);

  const handleConfirmReschedule = async (when: { date: string; start: string; end: string }) => {
    if (!reschedulingApp) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await rescheduleAppointment(reschedulingApp.id, when);
      setReschedulingApp(null);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не вдалося перенести запис');
    } finally {
      setActionBusy(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingApp) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await cancelAppointment(cancellingApp.id);
      setCancellingApp(null);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Не вдалося скасувати запис');
    } finally {
      setActionBusy(false);
    }
  };

  const row = (app: ExtendedAppointment) => (
    <AppointmentRow
      key={app.id}
      app={app}
      editing={editing.editingId === app.id}
      busy={editing.busy}
      error={editing.error}
      onEditReference={(target) => editing.open(target.id)}
      onCancelEdit={editing.close}
      onSaveReference={(target, edit) => void editing.save(target.id, edit)}
      onReschedule={() => {
        setActionError(null);
        setReschedulingApp(app);
      }}
      onCancelVisit={() => {
        setActionError(null);
        setCancellingApp(app);
      }}
      onBookAgain={(params) => router.push({ pathname: '/(client)/booking', params })}
    />
  );

  const matchStatus = (app: ExtendedAppointment) =>
    statusFilter === 'all' || app.status === statusFilter;
  const upcoming = appointments
    .filter((a) => (a.status === 'upcoming' || a.status === 'confirmed') && matchStatus(a))
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  const past = appointments
    .filter((a) => (a.status === 'completed' || a.status === 'cancelled') && matchStatus(a))
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));

  return (
    <>
      <VisitsBody
        error={error}
        loading={loading}
        statusFilter={statusFilter}
        onFilter={setStatusFilter}
        onRetry={() => void load()}
        onBook={() => router.push('/booking')}
        upcoming={upcoming}
        past={past}
        total={appointments.length}
        row={row}
      />
      <RescheduleModal
        visit={reschedulingApp}
        visible={Boolean(reschedulingApp)}
        busy={actionBusy}
        error={actionError}
        onClose={() => setReschedulingApp(null)}
        onConfirm={(when) => void handleConfirmReschedule(when)}
      />
      <CancelModal
        visit={cancellingApp}
        visible={Boolean(cancellingApp)}
        busy={actionBusy}
        error={actionError}
        onClose={() => setCancellingApp(null)}
        onConfirm={() => void handleConfirmCancel()}
      />
    </>
  );
}

export default MyVisitsScreen;
