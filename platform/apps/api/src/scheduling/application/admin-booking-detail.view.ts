// Форми read-моделі «деталі візиту» в адмінці (admin-screens §5.2 «Картка
// візиту»): плоска DTO, яку бачить адмін. Окремо від самої read-моделі
// (ADR 0019) і без join — довідники приходять окремими запитами.

/** Подія життєвого циклу візиту з outbox (журнал змін, REF-ADM-03). */
export interface BookingEventView {
  id: string;
  type: string;
  label: string;
  occurredAt: string;
  publishedAt: string | null;
  /** Ефективний стан: publishedAt є → published (dispatcher статус не міняє). */
  status: string;
  actor: string | null;
  details: string[];
}

/** Сперіфікація сповіщення за подією візиту (журнал notifications). */
export interface BookingNotificationView {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  subject: string;
  status: string;
  detail: string | null;
  sentAt: string;
}

/** Ноги партії (father-son): JSON довідник, який віддає prisma як legs. */
export interface PartyLegView {
  barberId?: string | null;
  role?: string | null;
}

/** Партія візиту (father-son тощо) — усі поля рядка AppointmentParty. */
export interface BookingPartyView {
  id: string;
  role: string;
  mode: string | null;
  userId: string | null;
  barberId: string | null;
  barberIds: string[];
  locationId: string | null;
  serviceId: string | null;
  agreedPrice: number | null;
  date: string | null;
  legs: PartyLegView[];
}

export interface BookingDetail {
  id: string;
  appointmentId: string | null;
  status: string;
  cancelReason: string | null;
  start: string;
  end: string;
  durationMinutes: number;
  agreedPrice: number | null;
  /** Снепшот узгодженої тривалості й обраного варіанта (T-4419). */
  agreedDuration: number | null;
  durationVariant: string | null;
  fulfillmentMode: string | null;
  source: string;
  comment: string | null;
  haircutReferenceId: string | null;
  partyRole: string | null;
  version: number;
  service: { id: string; name: string; duration: number; category: string | null } | null;
  location: { id: string; code: string; name: string; address: string } | null;
  barber: { id: string; name: string | null; phone: string | null } | null;
  client: {
    userId: string;
    profileId: string | null;
    name: string | null;
    phone: string | null;
    vipDiscountPercent: number | null;
    loyaltyVisitsCount: number | null;
  } | null;
  party: BookingPartyView | null;
  events: BookingEventView[];
  notifications: BookingNotificationView[];
}
