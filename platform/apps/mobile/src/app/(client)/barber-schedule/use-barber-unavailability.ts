// T-4616b: форма «не вийду» — день, причина, відправка. Позначка йде тим
// самим `MarkBarberUnavailable`, що й з адмінки: візити не скасовуються, а
// стають відкритими конфліктами для рішення засновника.
import { useCallback, useState } from 'react';
import {
  fullDayInterval,
  todayIso,
  unavailabilityNotice,
  upcomingDays,
} from '../../../lib/barber-unavailability';
import { markBarberUnavailable } from '../../../lib/api/barber-self-schedule';
import { useBarberScheduleData, type BarberScheduleData } from './use-barber-schedule-data';

export interface BarberUnavailabilityState extends BarberScheduleData {
  days: ReturnType<typeof upcomingDays>;
  day: string;
  reason: string;
  busy: boolean;
  notice: string | null;
  /** Позначені дні цієї сесії: день → скільки візитів чекають рішення. */
  marked: Record<string, number>;
  /** Скільки візитів чекають рішення на обраний день, або `null`, якщо не позначено. */
  markedConflicts: number | null;
  selectDay: (date: string) => void;
  setReason: (value: string) => void;
  submit: () => void;
}

export function useBarberUnavailability(): BarberUnavailabilityState {
  const data = useBarberScheduleData();
  const [days] = useState(() => upcomingDays(todayIso()));
  const [day, setDay] = useState(() => todayIso());
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // T-4616b: позначка лишається видимою й після зникнення повідомлення, щоб
  // барбер не шукав, чи день справді закритий, і не тиснув кнопку вдруге.
  const [marked, setMarked] = useState<Record<string, number>>({});
  const { token, locationId, canEdit } = data;

  const submit = useCallback(() => {
    if (!token || !locationId || !canEdit || busy) return;
    const interval = fullDayInterval(day);
    if (!interval) {
      setNotice('Оберіть коректну дату');
      return;
    }
    const trimmed = reason.trim();
    setBusy(true);
    setNotice(null);
    markBarberUnavailable(
      locationId,
      { ...interval, ...(trimmed ? { reason: trimmed } : {}) },
      token
    )
      .then((result) => {
        setMarked((prev) => ({ ...prev, [day]: result.conflictsCreated }));
        setReason('');
        setNotice(unavailabilityNotice(result.conflictsCreated));
      })
      .catch(() => setNotice('Не вдалося позначити день — спробуйте ще раз'))
      .finally(() => setBusy(false));
  }, [token, locationId, canEdit, busy, day, reason]);

  return {
    ...data,
    days,
    day,
    reason,
    busy,
    notice,
    marked,
    markedConflicts: marked[day] ?? null,
    selectDay: setDay,
    setReason,
    submit,
  };
}
