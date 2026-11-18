// Форми read-моделі «Мої візити» (web-cabinet-screens §3) — окремо від
// ListClientAppointments: статуси домену → словник кабінету.
export type CabinetStatus = 'upcoming' | 'confirmed' | 'completed' | 'cancelled';

export interface ClientAppointmentView {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  barberName: string;
  locationName: string;
  price: number;
  status: CabinetStatus;
  /**
   * ID референсного фото, а не URL: бакет приватний (ADR 0008 §2), тож
   * підписаний короткочасний URL клієнт бере окремим запитом. `null` — фото
   * не прикріплене (джерело «без референсу», REF-WEB-01).
   */
  referenceId: string | null;
  referenceComment: string;
  canEditReference: boolean;
  /**
   * Умови депозиту візиту (PAY-ADM-09); `null` — грошей у візиті немає.
   * `freeCancelUntil` рахується від поточного початку, тож перенесення
   * візиту зсуває дедлайн (T-4737).
   */
  deposit: { amount: number; freeCancelUntil: string } | null;
}

/** Мапінг доменних статусів Appointment → словник кабінету. */
export const CABINET_STATUS: Record<string, CabinetStatus> = {
  booked: 'upcoming',
  confirmed: 'confirmed',
  in_progress: 'confirmed',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'cancelled',
};

/** Рядок Booking, який читає read-модель (без join — імена окремим запитом). */
export interface BookingRow {
  id: string;
  appointmentId: string | null;
  barberId: string;
  locationId: string;
  serviceId: string | null;
  agreedPrice: number | null;
  status: string | null;
  haircutReferenceId: string | null;
  appointmentComment: string | null;
  start: Date;
  end: Date;
  /** Снепшот депозиту (PAY-ADM-09); `null` — візит без депозиту. */
  depositAmount: number | null;
  cancellationWindowHours: number | null;
}
