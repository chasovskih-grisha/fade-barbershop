import { SlotHoldExpirationService } from './slot-hold-expiration.service';

describe('SlotHoldExpirationService', () => {
  const service = new SlotHoldExpirationService({ holdDurationMinutes: 10 });

  it('marks hold active within 10 minutes', () => {
    const heldAt = new Date('2026-11-10T10:00:00.000Z');
    const currentTime = new Date('2026-11-10T10:05:00.000Z'); // 5 minutes elapsed
    const slotStart = new Date('2026-11-10T14:00:00.000Z');

    const result = service.assessHold({ slotStart, heldAt, currentTime });

    expect(result.isExpired).toBe(false);
    expect(result.remainingSeconds).toBe(300); // 5 minutes left
    expect(result.kyivStart).toHaveProperty('date');
    expect(result.kyivStart).toHaveProperty('time');
  });

  it('marks hold expired after 10 minutes', () => {
    const heldAt = new Date('2026-11-10T10:00:00.000Z');
    const currentTime = new Date('2026-11-10T10:11:00.000Z'); // 11 minutes elapsed
    const slotStart = new Date('2026-11-10T14:00:00.000Z');

    const result = service.assessHold({ slotStart, heldAt, currentTime });

    expect(result.isExpired).toBe(true);
    expect(result.remainingSeconds).toBe(0);
  });
});
