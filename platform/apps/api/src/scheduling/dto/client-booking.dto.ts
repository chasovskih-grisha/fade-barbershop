// DTO клієнтського підтвердження флоу запису (T-041, екран 5): контекст
// зібраний на кроках 0–4. Немає serviceDuration (клієнт обирає реальну
// послугу з каталогу) і немає origin — канал аналітики примусово 'web'.
/** Референс зачіски і коментар (T-043): снепшот на записі. */
export interface ClientReferenceDto {
  haircutReferenceId?: string;
  appointmentComment?: string;
}

export interface ClientBookingDto {
  /** Обраний барбер; відсутнє — «Будь-який барбер» (перший вільний слот). */
  barberId?: string;
  locationId: string;
  serviceId?: string;
  fulfillmentMode?: 'sequential' | 'parallel';
  date: string;
  start: string;
  end: string;
  /** Клієнт з identity/CRM (екран входу); канал аналітики примусово 'web'. */
  clientId?: string;
  /** Екран 4: референс/коментар (T-043) — снепшот на записі. */
  reference?: ClientReferenceDto;
  /** Токен checkout-резервації слота (T-4802), отриманий із POST /booking/slot-reservations. */
  reservationToken?: string;
}
