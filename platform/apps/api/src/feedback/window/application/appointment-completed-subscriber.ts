// Підписка на `scheduling.appointment.completed` (T-150, ADR 0016): міст між
// outbox-подією чужого контексту і вікном відгуку. Подія несе лише
// `appointmentId`, тож учасників візиту резолвить ACL, а вікно відкриває той
// самий сервіс, що й адмінський маршрут — повторна доставка не створює друге.
import type { FeedbackWindowService } from './feedback-window.service';

export const APPOINTMENT_COMPLETED_TYPE = 'scheduling.appointment.completed';

/** Подія журналу (outbox): тип, час і пейлоад. */
export interface FeedbackWindowEvent {
  type: string;
  occurredAt: Date;
  payload?: Record<string, unknown>;
}

export interface VisitParties {
  clientId: string;
  barberId: string | null;
  locationId: string | null;
}

/** ACL до scheduling: учасники візиту за `appointmentId`. */
export interface VisitPartiesLookup {
  partiesOf(appointmentId: string): Promise<VisitParties | null>;
}

export interface AppointmentCompletedSubscriberDeps {
  visits: VisitPartiesLookup;
  windows: FeedbackWindowService;
}

export class AppointmentCompletedFeedbackWindows {
  constructor(private readonly deps: AppointmentCompletedSubscriberDeps) {}

  async handleOne(event: FeedbackWindowEvent): Promise<{ handled: boolean; created?: boolean }> {
    if (event.type !== APPOINTMENT_COMPLETED_TYPE) return { handled: false };
    const appointmentId = event.payload?.['appointmentId'];
    if (typeof appointmentId !== 'string' || appointmentId.length === 0) {
      return { handled: false };
    }
    const parties = await this.deps.visits.partiesOf(appointmentId);
    if (!parties) return { handled: false };

    const { created } = await this.deps.windows.open({
      appointmentId,
      clientId: parties.clientId,
      barberId: parties.barberId,
      locationId: parties.locationId,
      completedAt: event.occurredAt,
    });
    return { handled: true, created };
  }
}
