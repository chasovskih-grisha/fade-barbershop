// T-4804: план місячних партицій і DDL.
import { monthlyPartitions, partitionDdl } from './partition-plan';

describe('partition plan (T-4804)', () => {
  it('будує місячні діапазони поспіль, включно з переходом через рік', () => {
    const plan = monthlyPartitions(new Date('2026-11-17T10:00:00Z'), 3);
    expect(plan.map((p) => p.name)).toEqual(['booking_2026_11', 'booking_2026_12', 'booking_2027_01']);
    expect(plan[0]?.from.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(plan[1]?.to.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('межа місяця не залежить від дня anchor', () => {
    expect(monthlyPartitions(new Date('2026-12-31T23:59:00Z'), 1)[0]).toEqual({
      name: 'booking_2026_12',
      from: new Date('2026-12-01T00:00:00Z'),
      to: new Date('2027-01-01T00:00:00Z'),
    });
  });

  it('DDL ідемпотентний і покриває діапазон', () => {
    const [range] = monthlyPartitions(new Date('2026-12-01T00:00:00Z'), 1);
    if (!range) throw new Error('plan is empty');
    expect(partitionDdl('booking', range)).toBe(
      'CREATE TABLE IF NOT EXISTS "booking_2026_12" PARTITION OF "booking" ' +
        "FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');"
    );
  });

  it('некоректна глибина плану — помилка', () => {
    expect(() => monthlyPartitions(new Date(), 0)).toThrow(RangeError);
    expect(() => monthlyPartitions(new Date(), 1.5)).toThrow(RangeError);
  });
});
