// T-4439: пороги гейтів запуску — межа 95% доставки і 3% 5xx.
import { DELIVERY_MIN, SERVER_ERROR_MAX, deliveryRate, launchGates, serverErrorRate, type LaunchCounters } from './launch-dashboard';

const base: LaunchCounters = {
  locationsOnline: 1,
  clientsCreated: 10,
  bookingsCreated: 20,
  noShows: 1,
  paymentsCaptured: 5,
  receiptsIssued: 5,
  smsAttempted: 100,
  smsDelivered: 96,
  pushAttempted: 0,
  pushDelivered: 0,
  httpRequests: 1000,
  serverErrors: 10,
};

describe('launch-dashboard gates (T-4439)', () => {
  it('доставка рахується по SMS і push разом', () => {
    expect(deliveryRate({ ...base, smsAttempted: 10, smsDelivered: 9, pushAttempted: 10, pushDelivered: 10 })).toBeCloseTo(
      0.95
    );
  });

  it('без спроб доставка вважається повною — нема чого провалювати', () => {
    expect(
      deliveryRate({ ...base, smsAttempted: 0, smsDelivered: 0, pushAttempted: 0, pushDelivered: 0 })
    ).toBe(1);
  });

  it('рівно 95% проходить гейт, 94.9% — ні', () => {
    expect(launchGates({ ...base, smsAttempted: 100, smsDelivered: 95 }).delivery.ok).toBe(true);
    expect(launchGates({ ...base, smsAttempted: 100, smsDelivered: 94 }).delivery.ok).toBe(false);
  });

  it('3% 5xx провалює гейт, 2.9% проходить (поріг строгий)', () => {
    expect(serverErrorRate({ ...base, serverErrors: 30 })).toBeCloseTo(SERVER_ERROR_MAX);
    expect(launchGates({ ...base, serverErrors: 30 }).serverErrors.ok).toBe(false);
    expect(launchGates({ ...base, serverErrors: 29 }).serverErrors.ok).toBe(true);
  });

  it('без запитів частка 5xx нульова, а не NaN', () => {
    expect(serverErrorRate({ ...base, httpRequests: 0, serverErrors: 0 })).toBe(0);
  });

  it('спільний ok — обидва гейти разом', () => {
    expect(launchGates(base).ok).toBe(true);
    expect(launchGates({ ...base, smsDelivered: 10 }).ok).toBe(false);
    expect(launchGates({ ...base, serverErrors: 500 }).ok).toBe(false);
  });

  it('пороги зафіксовані константами', () => {
    expect(DELIVERY_MIN).toBe(0.95);
    expect(SERVER_ERROR_MAX).toBe(0.03);
  });
});
