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
 *
 * До 2026-10-03 тут було лише amount і freeCancelUntil. Server-side
 * утримання крісла (T-4619a) додає bookingId, expiresAt і holdStatus —
 * опціональні, бо їх ще не всі візити мають.
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
  /**
   * Booking id для запиту доплати (POST /payment/bookings/:bookingId/deposit).
   * Присутній лише коли на візиті є server-side утримання крісла (T-4619a).
   */
  bookingId?: string;
  /**
   * Дедлайн серверного утримання крісла (ISO); null — утримання не створювали
   * або відмінили. Присутній разом із holdStatus, коли hold існує.
   */
  expiresAt?: string | null;
  /**
   * Стан утримання крісла: active | captured | expired | cancelled.
   * absent — візит без hold (старий API або візит без депозитного утримання).
   */
  holdStatus?: 'active' | 'captured' | 'expired' | 'cancelled';
  /**
   * Повернення депозиту (T-094): `processing`/`pending` — гроші в дорозі,
   * `completed` — повернуто, `failed` — потрібен зв'язок із салоном.
   * absent — повернень не було.
   */
  refund?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    /** Сума повернення в грн. */
    amount: number;
  };
}

export interface ExtendedAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  /** ISO-початок візиту; відсутній — старий API, календарних посилань немає. */
  startsAt?: string;
  /** ISO-кінець візиту (T-4446b). */
  endsAt?: string;
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
  /**
   * Чи можна почати повторний запис (T-4617). Сервер ставить `false` для
   * візиту в партії: флоу ще не вміє передзаповнення пакета.
   */
  canBookAgain: boolean;
  /** Немає поля або null — депозиту немає, наслідок скасування не називається. */
  deposit?: DepositTerms | null;
  /**
   * Причина скасування з сервера (T-4616a). `BARBER_UNAVAILABLE_CANCEL_REASON`
   * (`@fade/contracts`) — барбер недоступний: кабінет каже це прямим текстом і
   * пропонує записатися знову.
   */
  cancelReason?: string | null;
}

/**
 * Посилання у намірі повторного запису (T-4617a). `stale` — об'єкт більше
 * не дійсний для нового запису: поле треба обрати заново.
 */
export interface BookAgainRef {
  id: string;
  name: string;
  stale: boolean;
}

/** Відповідь GET /appointments/:id/book-again: локація, послуга, барбер і
 * поточна ціна локації. Нічого не створює і не тримає слот (T-4617a). */
export interface BookAgainIntent {
  location: BookAgainRef;
  service: BookAgainRef | null;
  barber: BookAgainRef;
  /** Поточна ціна локації; null — ціни немає (поле порожнє, не вигадане число). */
  price: number | null;
}

/** Відповідь API. `null`/`undefined` нормалізуються в клієнті перед використанням. */
export interface AppointmentResponse {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  startsAt?: string;
  endsAt?: string;
  serviceName: string;
  barberName: string;
  locationName: string;
  price: number;
  status: CabinetStatus;
  referenceId?: string | null;
  referenceComment?: string;
  canEditReference?: boolean;
  /** Правило партії (T-4617); відсутність — старий API, дію не ховаємо. */
  canBookAgain?: boolean;
  cancelReason?: string | null;
  /** Снепшот умов депозиту візиту; відсутність — візит без депозиту. */
  deposit?: Partial<DepositTerms> | null;
}
