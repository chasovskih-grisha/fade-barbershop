export type CabinetStatus = 'upcoming' | 'confirmed' | 'completed' | 'cancelled';

/**
 * Словник статусів кабінету клієнта: domain status -> cabinet status.
 *
 * Dзеркалоє CABINET_STATUS з `apps/api/src/scheduling/application/client-appointments.view.ts`
 * і дзеркає `getAppointments()` на `GET /booking/appointments`, у якого сервер
 * вже перетворює доменні статуси в цей словник.
 */
export const CABINET_STATUS: Record<string, CabinetStatus> = {
  booked: 'upcoming',
  confirmed: 'confirmed',
  in_progress: 'confirmed',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'cancelled',
};

/** Рядок Booking з іменами послуги/барбера/локації. */
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
}

/** Читану відповідь `GET /booking/appointments` (reuse web contract). */
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
  /** raw DB id, NOT signed URL — signed URL береться окремим запитом (ADR 0008 §2). */
  referenceId: string | null;
  referenceComment: string;
  canEditReference: boolean;
  /** Чи можна почати повторний запис (T-4617); `false` — візит у партії. */
  canBookAgain: boolean;
}

/** Повний тип візиту для клієнтського кабінету (reuse @fade/web contract). */
export interface ExtendedAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  barberName: string;
  locationName: string;
  price: number;
  status: CabinetStatus;
  referenceId: string | null;
  referenceComment: string;
  canEditReference: boolean;
  /** Чи можна почати повторний запис (T-4617); `false` — візит у партії. */
  canBookAgain: boolean;
}
