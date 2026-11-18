// Row-контракти (DTO-подібні структури рядків Prisma) для маперів
// admin-booking-detail.map.ts. Окремо — щоб мапери лишалися чистими функціями.

/** Поля рядка Booking, які бачить адмін (без довідників — вони окремими запитами). */
export interface BookingRow {
  id: string;
  appointmentId: string | null;
  status: string | null;
  cancelReason: string | null;
  start: Date;
  end: Date;
  agreedPrice: number | null;
  fulfillmentMode: string | null;
  source: string | null;
  appointmentComment: string | null;
  haircutReferenceId: string | null;
  partyRole: string | null;
  version: number;
}

export interface PartyRow {
  id: string;
  role: string;
  mode: string | null;
  userId: string | null;
  barberId: string | null;
  barberIds: string[];
  locationId: string | null;
  serviceId: string | null;
  agreedPrice: number | null;
  date: Date | null;
  partyLegs: unknown;
}

export interface OutboxRow {
  id: string;
  type: string;
  payload: unknown;
  status: string;
  createdAt: Date;
  publishedAt: Date | null;
}

export interface NotificationRow {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  subject: string;
  status: string;
  detail: string | null;
  sentAt: Date;
}
