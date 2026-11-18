'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { getAppointments, ExtendedAppointment } from '@/lib/api/appointments';
import { runVisitAction } from './visit-actions';
import { useVisitCommands } from './useVisitCommands';

export type VisitDialog = 'reschedule' | 'cancel' | 'reference' | null;

const LOAD_FAILED = 'Не вдалося завантажити візити. Спробуйте пізніше.';

export function useAppointmentsPage() {
  const { isLoading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ExtendedAppointment | null>(null);
  const [dialog, setDialog] = useState<VisitDialog>(null);
  const [busy, setBusy] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      setAppointments(await getAppointments());
    } catch {
      if (quiet) setActionError(LOAD_FAILED);
      else setError(LOAD_FAILED);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);
  const apply = async (key: string, action: () => Promise<void>) => {
    setBusy(true);
    setProcessingAction(key);
    setActionError(null);
    const message = await runVisitAction(action);
    if (message) setActionError(message);
    else {
      await load(true);
      setDialog(null);
      setSelected(null);
    }
    setProcessingAction(null);
    setBusy(false);
  };
  const open = (next: VisitDialog) => (app: ExtendedAppointment) => {
    setActionError(null);
    setSelected(app);
    setDialog(next);
  };

  // Групи кабінету: «майбутні» — активні статуси, «минулі» — завершені й
  // скасовані (CABINET_STATUS на боці API).
  const upcoming = appointments.filter((a) => a.status === 'upcoming' || a.status === 'confirmed');

  return {
    authLoading,
    loading,
    error,
    actionError,
    selected,
    dialog,
    busy,
    upcoming,
    past: appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled'),
    cardProps: {
      processingAction,
      onReschedule: open('reschedule'),
      onCancel: open('cancel'),
      onEditReference: open('reference'),
    },
    close: () => {
      if (busy) return;
      setDialog(null);
      setSelected(null);
      setActionError(null);
    },
    ...useVisitCommands({ apply, selected }),
  };
}
