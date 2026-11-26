// Форми read-моделі «Мої візити» (web-cabinet-screens §3) — окремо від
// ListClientAppointments: статуси домену → словник кабінету.
export type CabinetStatus = 'upcoming' | 'confirmed' | 'completed' | 'cancelled';

export interface ClientAppointmentView {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  /** Абсолютний початок візиту (ISO): джерело для посилання «Додати в календар». */
  startsAt: string;
  /** Абсолютний кінець візиту (ISO); саме він робить посилання датованим. */
  endsAt: string;
  serviceName: string;
  barberName: string;
  locationName: string;
  price: number;
  status: CabinetStatus;
  /**
   * Канал створення візиту (`walk_in`, `client_web`, …). Веб-сторінка барбера
   * читає його, щоб показати оплату на місці лише walk-in (PAY-ONS-01,
   * WALK-BAR-03): решту онлайн-візиту позначає адміністратор.
   */
  source: string;
  /**
   * ID референсного фото, а не URL: бакет приватний (ADR 0008 §2), тож
   * підписаний короткочасний URL клієнт бере окремим запитом. `null` — фото
   * не прикріплене (джерело «без референсу», REF-WEB-01).
   */
  referenceId: string | null;
  referenceComment: string;
  canEditReference: boolean;
  /**
   * Чи можна почати повторний запис із цього візиту (T-4617). Візит у партії
   * (father-and-son) — `false`: флоу ще не вміє передзаповнення пакета, тож
   * кнопка ховається, а не створює запис на одну ногу.
   */
  canBookAgain: boolean;
  /**
   * Причина скасування (T-4616a). Кабінет показує «барбер недоступний» лише
   * тоді, коли це справді так, і не вгадує причину замість сервера.
   */
  cancelReason: string | null;
  /**
   * Умови депозиту візиту (PAY-ADM-09); `null` — грошей у візиті немає.
   * `freeCancelUntil` рахується від поточного початку, тож перенесення
   * візиту зсуває дедлайн (T-4737).
   */
  deposit: {
    amount: number;
    freeCancelUntil: string;
    bookingId?: string;
    expiresAt?: string;
    holdStatus?: 'active' | 'captured' | 'expired' | 'cancelled';
    /** Повернення депозиту (T-094); absent — повернень не було. */
    refund?: { status: 'pending' | 'processing' | 'completed' | 'failed'; amount: number };
  } | null;
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
  /** Канал створення візиту (ANL-004); `null` у старих рядках — трактуємо як `web`. */
  source: string | null;
  /** `null` — візит поза партією; інакше частина father-and-son запису. */
  partyId: string | null;
  haircutReferenceId: string | null;
  appointmentComment: string | null;
  start: Date;
  end: Date;
  /** Снепшот депозиту (PAY-ADM-09); `null` — візит без депозиту. */
  depositAmount: number | null;
  cancellationWindowHours: number | null;
  /** Причина скасування (T-4616a): `barber unavailable` — барбер недоступний. */
  cancelReason?: string | null;
}
