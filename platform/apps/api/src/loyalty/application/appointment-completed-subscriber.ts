// Підписник лояльності на подію `scheduling.appointment.completed` (T-140,
// ADR 0009): міст між outbox-подією чужого контексту і use case лічильника.
// Резолвить clientId за візитом (подія scheduling несе appointmentId, не
// clientId) і делегує ідемпотентну обробку ProcessAppointmentCompletedHandler.
// Події без appointmentId або без профілю (анонімний walk-in, WNB-005) — не наші.

import { ProcessAppointmentCompletedHandler } from './process-appointment-completed.use-case';

export const APPOINTMENT_COMPLETED_TYPE = 'scheduling.appointment.completed';

/** Подія журналу (outbox): тип, час, пейлоад. */
export interface LoyaltyEvent {
  type: string;
  occurredAt: Date;
  payload?: Record<string, unknown>;
}

/** Резолвер клієнта за візитом: той самий контракт, що й у проєкції crm. */
export interface LoyaltyClientLookup {
  clientIdOf(appointmentId: string): Promise<string | null>;
}

export interface AppointmentCompletedSubscriberDeps {
  clients: LoyaltyClientLookup;
  counter: ProcessAppointmentCompletedHandler;
}

export class AppointmentCompletedSubscriber {
  constructor(private readonly deps: AppointmentCompletedSubscriberDeps) {}

  async handleOne(event: LoyaltyEvent): Promise<{ handled: boolean }> {
    if (event.type !== APPOINTMENT_COMPLETED_TYPE) return { handled: false };

    const appointmentId = event.payload?.['appointmentId'];
    if (typeof appointmentId !== 'string' || appointmentId.length === 0) {
      return { handled: false };
    }

    const clientId = await this.deps.clients.clientIdOf(appointmentId);
    if (!clientId) return { handled: false };

    await this.deps.counter.handle({
      clientId,
      appointmentId,
      occurredAt: event.occurredAt,
    });
    return { handled: true };
  }
}
