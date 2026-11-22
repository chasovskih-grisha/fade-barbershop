import {
  buildZeroDowntimeRotation,
  daysUntilRotation,
  nextRotationAt,
  planRotation,
  type SecretDescriptor,
} from './secret-rotation';

const now = new Date('2026-11-22T00:00:00Z');

function secret(name: string, rotatedAt: string, intervalDays = 30): SecretDescriptor {
  return {
    name,
    owner: 'platform',
    lastRotatedAt: new Date(rotatedAt),
    rotationIntervalDays: intervalDays,
  };
}

describe('secret rotation planning (T-5026)', () => {
  it('computes the next rotation date and remaining days', () => {
    const db = secret('DB_PASSWORD', '2026-11-10T00:00:00Z');
    expect(nextRotationAt(db).toISOString()).toBe('2026-12-10T00:00:00.000Z');
    expect(daysUntilRotation(db, now)).toBe(18);
  });

  it('separates overdue secrets from those inside the horizon', () => {
    const plan = planRotation(
      [
        secret('DB_PASSWORD', '2026-10-01T00:00:00Z'),
        secret('STRIPE_KEY', '2026-10-25T00:00:00Z'),
        secret('SMTP_PASSWORD', '2026-11-01T00:00:00Z'),
      ],
      now,
      7
    );

    expect(plan.due.map((item) => item.name)).toEqual(['DB_PASSWORD']);
    expect(plan.upcoming.map((item) => item.name)).toEqual(['STRIPE_KEY']);
    expect(plan.nextRotationAt?.toISOString()).toBe('2026-10-31T00:00:00.000Z');
  });

  it('orders rotation steps so the old credential outlives activation', () => {
    const steps = buildZeroDowntimeRotation(secret('STRIPE_KEY', '2026-11-01T00:00:00Z'), now, 10);

    expect(steps.map((step) => step.phase)).toEqual(['stage', 'activate', 'retire']);
    expect(steps[1]?.executeAt.toISOString()).toBe('2026-11-22T00:10:00.000Z');
    expect(steps[2]?.executeAt.toISOString()).toBe('2026-11-22T00:20:00.000Z');
  });
});
