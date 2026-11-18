// Типи деталей візиту в адмінці: дзеркало GET /admin/bookings/:id
// (admin-booking-detail.view.ts на API). Окремо від хука й розкладки.

export interface BookingEventView {
  id: string;
  type: string;
  label: string;
  occurredAt: string;
  publishedAt: string | null;
  status: string;
  actor: string | null;
  details: string[];
}

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

export interface PartyLegView {
  barberId?: string | null;
  role?: string | null;
}

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
