import { waitingForDeposit } from './next-visit';
import type { ExtendedAppointment } from '@/lib/api/appointments';

function visit(deposit: NonNullable<ExtendedAppointment['deposit']>): ExtendedAppointment {
  return {
    id: 'v1',
    date: '2026-10-02',
    startTime: '09:00',
    endTime: '10:00',
    serviceName: 'Стрижка',
    barberName: 'Олександр',
    locationName: 'Центр',
    price: 600,
    status: 'confirmed',
    referenceId: null,
    referenceComment: '',
    canEditReference: true,
    canBookAgain: true,
    deposit: deposit,
  };
}

describe('next-visit deposit hold state', () => {
  it('does not warn when the deposit is already paid', () => {
    expect(
      waitingForDeposit(
        visit({
          amount: 200,
          freeCancelUntil: null,
          bookingId: 'bk-1',
          holdStatus: 'captured',
          expiresAt: '2030-01-01T10:00:00Z',
        })
      )
    ).toBe(false);
  });

  it('does not warn when the chair was released', () => {
    expect(
      waitingForDeposit(
        visit({
          amount: 200,
          freeCancelUntil: null,
          bookingId: 'bk-1',
          holdStatus: 'expired',
          expiresAt: '2026-01-01T10:00:00Z',
        })
      )
    ).toBe(false);
  });
});
