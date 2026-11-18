// Форма даних агрегату Appointment (T-042a) — окремо від поведінки класу
// (appointment.aggregate.ts): DTO/типи і хелпер подій без залежності від класу.
import type { AppointmentEventInput } from './appointment.events';
import type { AppointmentStatus } from './appointment.transitions';

export interface AppointmentData {
  id: string;
  bookingId: string;
  locationId: string;
  barberId: string;
  status: AppointmentStatus;
  start: string;
  end: string;
  cancelReason?: string;
  /** Референс зачіски (T-043): лише ID — haircut-ai або зовнішній upload. */
  haircutReferenceId?: string | null;
  /** Коментар до візиту (T-043): plain text ≤500 (валідує use case). */
  appointmentComment?: string | null;
}

/** Хто ініціював команду (клієнт/адмін/барбер) — потрапляє в доменну подію. */
export type ActorInput = { actorId?: string; actorRole?: string };

/** Спільний базис усіх подій агрегату: id/учасники/слот/час події. */
export function appointmentEventInput(
  data: AppointmentData,
  occurredAt: Date
): AppointmentEventInput {
  return {
    appointmentId: data.id,
    locationId: data.locationId,
    barberId: data.barberId,
    occurredAt,
    start: data.start,
    end: data.end,
  };
}
