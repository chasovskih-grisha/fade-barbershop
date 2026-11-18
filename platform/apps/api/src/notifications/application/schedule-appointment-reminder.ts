// Планувальник нагадування про візит (T-080): подія візиту (booked /
// rescheduled) → відкладена рядок outbox «notification.reminder.due» з часом
// спрацювання start − leadMinutes. Сама доставка — окремий споживач
// (send-appointment-reminder), тож перенесення візиту переживає рестарт, а
// повторна доставка тієї ж події не дублює нагадування (журнал за eventId).
// Падіння schedule НЕ пишеться в журнал — подія лишається pending (ретрай).

import {
  REMINDER_TRIGGER_TYPES,
  type ReminderDuePayload,
  type ReminderScheduleOutcome,
  type ScheduleReminderDeps,
} from './appointment-reminder-ports';
import type { NotificationEvent, NotificationRecordInput } from './booking-confirmation-ports';

const RESCHEDULED_EVENT_TYPE = 'scheduling.appointment.rescheduled';
/** Нижня межа: ближче — «нагадування» прийшло б уже після початку візиту. */
const MIN_SEND_LEAD_MS = 15 * 60_000;
/**
 * Журнал NotificationRecord має унікальний eventId, а подію візиту читають
 * кілька споживачів (підтвердження T-4608 і планувальник нагадування). Тому
 * планувальник пише під іменем споживача: без суфікса він або побачив би
 * запис підтвердження (→ «дубль», нагадування не планується), або впав би
 * на унікальному індексі. Ключ reminder.due — його власний рядок outbox.
 */
const JOURNAL_SUFFIX = ':reminder-schedule';

/** Час візиту в події: booked несе start, rescheduled — newStart. */
function startOfVisit(payload: Record<string, unknown>): Date | null {
  const raw = payload.start ?? payload.newStart;
  if (typeof raw !== 'string') return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export class ScheduleAppointmentReminder {
  constructor(private readonly deps: ScheduleReminderDeps) {}

  async handleOne(event: NotificationEvent): Promise<ReminderScheduleOutcome> {
    if (!REMINDER_TRIGGER_TYPES.includes(event.type)) return { handled: false, reason: 'ignored' };
    if (await this.deps.journal.alreadyHandled(journalKey(event.id)))
      return { handled: false, reason: 'duplicate' };

    const settings = await this.deps.settings.get();
    if (settings.channel === 'none') return this.skip(event, 'канал нагадувань вимкнено в адмінці');

    const appointmentId = event.aggregateId;
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    // Перенесення: старе нагадування більше не про старий час — закриваємо
    // його, інакше клієнт отримає «нагадування» на скасоване вікно.
    if (event.type === RESCHEDULED_EVENT_TYPE)
      await this.deps.schedule.cancelPending(appointmentId);

    const leadMs = settings.leadMinutes * 60_000;
    const now = this.deps.now?.() ?? new Date();
    const start = startOfVisit(payload);
    if (!start) return this.skip(event, 'подія без коректного часу візиту');
    // Нагадування не пізніше ніж за MIN_SEND_LEAD_MS до візиту — інакше
    // «нагадування» прийде у момент старту або після нього.
    if (start.getTime() - now.getTime() < Math.min(leadMs, MIN_SEND_LEAD_MS))
      return this.skip(event, 'візит уже минув або занадто близько');

    const fireAt = new Date(start.getTime() - leadMs);
    await this.deps.schedule.schedule({
      appointmentId,
      fireAt,
      payload: reminderPayload({ appointmentId, fireAt, start, payload }),
    });
    await this.mark(event, settings.channel, `нагадування на ${fireAt.toISOString()}`);
    return { handled: true, reason: 'sent' };
  }

  /** Свідома відмова: рядок не плануємо, але eventId займає журнал. */
  private async skip(event: NotificationEvent, detail: string): Promise<ReminderScheduleOutcome> {
    await this.mark(event, 'none', detail);
    return { handled: true, reason: 'skipped' };
  }

  /** Запис журналу: bundle-параметри (гейт max-params). */
  private async mark(event: NotificationEvent, channel: string, detail: string): Promise<void> {
    const input: NotificationRecordInput = {
      eventId: journalKey(event.id),
      type: event.type,
      channel,
      recipient: '',
      subject: '',
      detail,
    };
    await this.deps.journal.markSent(input);
  }
}

/** Ключ журналу планувальника: подія візиту + ім'я споживача. */
function journalKey(eventId: string): string {
  return `${eventId}${JOURNAL_SUFFIX}`;
}

/** Payload відкладеної події: лише ті поля, що є в події візиту. */
function reminderPayload(input: {
  appointmentId: string;
  fireAt: Date;
  start: Date;
  payload: Record<string, unknown>;
}): ReminderDuePayload {
  const { appointmentId, fireAt, start, payload } = input;
  return {
    appointmentId,
    fireAt: fireAt.toISOString(),
    start: start.toISOString(),
    ...(typeof payload.locationId === 'string' ? { locationId: payload.locationId } : {}),
    ...(typeof payload.serviceId === 'string' ? { serviceId: payload.serviceId } : {}),
  };
}

export { REMINDER_TRIGGER_TYPES };
export type { ReminderDuePayload, ScheduleReminderDeps } from './appointment-reminder-ports';
