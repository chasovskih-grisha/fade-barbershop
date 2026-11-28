import type { ExtendedAppointment } from '@/lib/api/appointments';
import { depositHoldView } from '../appointments/deposit-summary';

function visit(deposit: NonNullable<ExtendedAppointment['deposit']>): ExtendedAppointment {
  return {
    id: 'v1',
    date: '2026-12-04',
    startTime: '14:00',
    endTime: '15:00',
    serviceName: 'Стрижка',
    barberName: 'Олександр',
    locationName: 'Центр',
    price: 600,
    status: 'confirmed',
    referenceId: null,
    referenceComment: '',
    canEditReference: true,
    canBookAgain: true,
    deposit,
  };
}

export const nextVisitHoldCases = {
  paid: visit({
    amount: 200,
    freeCancelUntil: null,
    bookingId: 'bk-1',
    holdStatus: 'captured',
    expiresAt: '2030-01-01T10:00:00Z',
  }),
  released: visit({
    amount: 200,
    freeCancelUntil: null,
    bookingId: 'bk-1',
    holdStatus: 'expired',
    expiresAt: '2026-01-01T10:00:00Z',
  }),
};

export function nextVisitWaitingCases() {
  return {
    active: visit({
      amount: 200,
      freeCancelUntil: null,
      bookingId: 'bk-1',
      holdStatus: 'active',
      expiresAt: '2030-01-01T10:15:00.000Z',
    }),
  };
}
