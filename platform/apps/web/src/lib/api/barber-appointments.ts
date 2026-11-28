// Клієнт власних візитів барбера: читає GET /barber/appointments з cookie
// fadoidx. Тип відповіді повторює назви полів read-моделі ListClientAppointments
// (ClientAppointmentView), бо контролер повертає той самий view — лише з
// фільтром barberId = session.userId замість clientId.
//
// deposit — це ClientDepositView з бекенду:
//   { amount, freeCancelUntil, bookingId?, expiresAt?, holdStatus? }
// bookingId і expiresAt з'являються лише коли існує server-side hold
// (T-4619a). freeCancelUntil — мертвий або ще активний дедлайн безкоштовного
// скасування; його використовує веб-рядок депозита в DepositPanel.

export type ClientAppointmentView = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  barberName: string;
  locationName: string;
  price: number;
  status: string;
  // Канал створення візиту: `walk_in` — єдиний, де барбер позначає оплату
  // на місці (PAY-ONS-01); решту онлайн-візитів позначає адміністратор.
  source: string;
  referenceId: string | null;
  referenceComment: string;
  canEditReference: boolean;
  canBookAgain: boolean;
  deposit?: {
    amount: number;
    freeCancelUntil: string;
    bookingId?: string;
    expiresAt?: string;
    holdStatus?: string;
  };
};
