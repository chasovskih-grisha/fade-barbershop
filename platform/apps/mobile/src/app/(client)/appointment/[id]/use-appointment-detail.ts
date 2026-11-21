import { useEffect, useState } from 'react';
import { getAppointments } from '../../../../lib/api/appointments';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { fetchAppointmentReference, type AppointmentReference } from './appointment-reference-api';

export function useAppointmentDetail(id: string) {
  const [appointment, setAppointment] = useState<ExtendedAppointment | null>(null);
  const [reference, setReference] = useState<AppointmentReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const list = await getAppointments();
        const found = list.find((item) => item.id === id) ?? null;
        const nextReference = found ? await fetchAppointmentReference(id) : null;
        if (!mounted) return;
        setAppointment(found);
        setReference(nextReference);
        setFailed(false);
      } catch {
        if (mounted) setFailed(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [id, nonce]);

  return { appointment, reference, loading, failed, reload: () => setNonce((value) => value + 1) };
}
