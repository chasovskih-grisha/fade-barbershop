// Контракт «Моїх візитів» (GET /booking/appointments). Тільки те, що API
// реально надсилає: до 2026-10-02 тут були ще finalPrice/discounts/deposit*/
// reviewSubmitted та статус awaiting_deposit, але бекенд їх не мав (у Booking
// немає колонок депозиту, моделі Review у схемі немає, а маршрутів pay-deposit
// і review не існувало) — UI показував кнопки, які не могли спрацювати.

/** Словник кабінету; дзеркалить CABINET_STATUS на боці API. */
export type CabinetStatus = 'upcoming' | 'confirmed' | 'completed' | 'cancelled';

/**
 * Умови депозиту, які візит несе із собою: снепшот політики на момент
 * запису (PAY-ADM-09) — API віддає його в GET /booking/appointments.
 * Діалог скасування читає лише їх — жодних запитів до billing (T-4737).
 */
export interface DepositTerms {
  /** Сума депозиту в грн; 0 — грошей у візиті немає (безкоштовний візит). */
  amount: number;
  /**
   * Снепшот вікна скасування (PAY-ADM-09): ISO-момент, до якого скасування
   * повертає депозит. Вікно залежить від візиту, не від константи в UI.
   * null — вікно на візиті не збереглося, і діалог мовчить про гроші.
   */
  freeCancelUntil: string | null;
}

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
  /** ID фото референсу; підписаний URL береться окремим запитом (REF-WEB-03). */
  referenceId: string | null;
  referenceComment: string;
  /** Право редагування вирішує сервер: лише до підтвердження барбером. */
  canEditReference: boolean;
  /** Немає поля або null — депозиту немає, наслідок скасування не називається. */
  deposit?: DepositTerms | null;
}

/** Відповідь API. `null`/`undefined` нормалізуються в клієнті перед використанням. */
export interface AppointmentResponse {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  serviceName: string;
  barberName: string;
  locationName: string;
  price: number;
  status: CabinetStatus;
  referenceId?: string | null;
  referenceComment?: string;
  canEditReference?: boolean;
  /** Снепшот умов депозиту візиту; відсутність — візит без депозиту. */
  deposit?: Partial<DepositTerms> | null;
}
