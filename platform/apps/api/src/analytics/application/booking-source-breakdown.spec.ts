// T-4536: розбивка за каналом — аліаси зливаються в канонічні значення.
import { GetBookingSourceBreakdown, groupByCanonical, type BookingSourceStats } from './booking-source-breakdown';

const FROM = new Date('2026-10-01T00:00:00Z');
const TO = new Date('2026-11-01T00:00:00Z');

class FakeStats implements BookingSourceStats {
  readonly calls: [Date, Date][] = [];
  constructor(private readonly rows: { source: string; count: number }[]) {}
  async countsBetween(from: Date, to: Date): Promise<{ source: string; count: number }[]> {
    this.calls.push([from, to]);
    return this.rows;
  }
}

describe('booking source breakdown (T-4536)', () => {
  it('зливає історичні аліаси в канонічний канал', () => {
    expect(
      groupByCanonical([
        { source: 'web', count: 4 },
        { source: 'client_web', count: 6 },
        { source: 'admin', count: 3 },
        { source: 'walk_in', count: 1 },
      ])
    ).toEqual([
      { source: 'client_web', count: 10 },
      { source: 'admin_phone', count: 3 },
      { source: 'walk_in', count: 1 },
    ]);
  });

  it('невідомий канал не губиться — потрапляє в unknown', () => {
    expect(groupByCanonical([{ source: 'legacy_import', count: 2 }])).toEqual([
      { source: 'unknown', count: 2 },
    ]);
  });

  it('сортує за кількістю, потім за назвою', () => {
    expect(
      groupByCanonical([
        { source: 'gbp', count: 1 },
        { source: 'quick_booking', count: 1 },
        { source: 'client_mobile', count: 5 },
      ]).map((row) => row.source)
    ).toEqual(['client_mobile', 'gbp', 'quick_booking']);
  });

  it('передає вікно у статистику і повертає ISO-межі', async () => {
    const stats = new FakeStats([{ source: 'client_web', count: 2 }]);
    const result = await new GetBookingSourceBreakdown(stats).handle(FROM, TO);
    expect(stats.calls).toEqual([[FROM, TO]]);
    expect(result.from).toBe('2026-10-01T00:00:00.000Z');
    expect(result.sources).toEqual([{ source: 'client_web', count: 2 }]);
  });

  it('відмовляє на перевернутому вікні', async () => {
    await expect(new GetBookingSourceBreakdown(new FakeStats([])).handle(TO, FROM)).rejects.toThrow(
      RangeError
    );
  });
});
