// Обгортка e2e нагадування про візит (T-080): відкриває релей і тримає стан
// одного візиту (appointmentId + eventIds для прибирання). Виносить однаковий
// setup за межі spec (LOC-гейт) і дає спекам спільні begin/bookEvent/cleanup.
import { uuidv7 } from '@fade/domain-shared';
import { openReminderRelay, type ReminderRelayHarness } from './reminder-relay.harness';

export const LEAD_MINUTES = 120;
export const VISIT_START = new Date(Date.now() + 3 * 24 * 60 * 60_000);

export interface VisitReminder {
  relay: ReminderRelayHarness;
  appointmentId: string;
  /** Локація візиту — uuid (payload події, T-4300b). */
  locationId: string;
  /** Новий візит і канал sms — ізоляція між тестами. */
  begin(): Promise<void>;
  /** Рядок події запису в outbox + ключі його споживачів у список прибирання. */
  bookEvent(): Promise<string>;
  /** Запам'ятати eventId для cleanup. */
  remember(ids: string[]): void;
  cleanup(): Promise<void>;
  close(): Promise<void>;
}

export async function openVisitReminder(): Promise<VisitReminder> {
  const relay = await openReminderRelay();
  const eventIds: string[] = [];
  const visit: VisitReminder = {
    relay,
    appointmentId: '',
    locationId: '',
    async begin() {
      // appointmentId — uuid-колонка (T-4300b): без читабельного префікса.
      visit.appointmentId = uuidv7();
      visit.locationId = uuidv7();
      eventIds.length = 0;
      await relay.setSettings({ channel: 'sms', leadMinutes: LEAD_MINUTES });
    },
    async bookEvent() {
      const id = await relay.appendVisitEvent({
        appointmentId: visit.appointmentId,
        type: 'scheduling.appointment.booked',
        payload: {
          appointmentId: visit.appointmentId,
          locationId: visit.locationId,
          start: VISIT_START.toISOString(),
        },
      });
      visit.remember([id]);
      return id;
    },
    remember(ids) {
      // Прибираємо лише справжні id: рядки нагадувань знімаються за aggregateId.
      for (const id of ids) eventIds.push(id);
    },
    cleanup: () => relay.cleanup({ appointmentId: visit.appointmentId, eventIds }),
    close: () => relay.close(),
  };
  return visit;
}
