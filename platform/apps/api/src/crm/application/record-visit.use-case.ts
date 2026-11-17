// Проєкція історії візитів (crm, T-061): подія scheduling → факт Visit.
// Патерн ADR 0009: обробник ідемпотентний за appointmentId — повторна доставка
// не дублює ефекту (upsert + guard за occurredAt у домені). Клієнта резолвимо
// окремим портом: події scheduling несуть appointmentId, а не clientId; візит
// без профілю (анонімний walk-in, WNB-005) проєкцію не створює.

import { applyVisitEvent, type Visit, type VisitEvent } from '../domain/visit';
import type { VisitRepository } from '../domain/visit.repository';

/** Резолвер клієнта за візитом: Booking.clientId (два шляхи — id АБО userId). */
export interface VisitClientLookup {
  clientIdOf(appointmentId: string): Promise<string | null>;
}

export interface RecordVisitDeps {
  visits: VisitRepository;
  clients: VisitClientLookup;
}

export interface RecordVisitInput {
  event: VisitEvent;
}

export interface RecordVisitOutput {
  recorded: boolean;
  visit: Visit | null;
}

export class RecordVisitHandler {
  constructor(private readonly deps: RecordVisitDeps) {}

  async handle(input: RecordVisitInput): Promise<RecordVisitOutput> {
    const appointmentId = input.event.payload?.['appointmentId'];
    if (typeof appointmentId !== 'string' || appointmentId.length === 0) {
      return { recorded: false, visit: null };
    }

    const clientId = await this.deps.clients.clientIdOf(appointmentId);
    if (!clientId) return { recorded: false, visit: null };

    const current = await this.deps.visits.findByAppointmentId(appointmentId);
    const visit = applyVisitEvent(current, input.event, clientId);
    if (!visit) return { recorded: false, visit: current };

    await this.deps.visits.save(visit);
    return { recorded: true, visit };
  }
}
