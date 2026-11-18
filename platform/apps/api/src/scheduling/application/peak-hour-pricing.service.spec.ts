import { PeakHourPricingService, DEFAULT_PEAK_PRICING_CONFIG } from './peak-hour-pricing.service';

describe('PeakHourPricingService (Booking Engine Optimization Specialist)', () => {
  let service: PeakHourPricingService;

  beforeEach(() => {
    service = new PeakHourPricingService(DEFAULT_PEAK_PRICING_CONFIG);
  });

  it('applies standard pricing for off-peak weekday slots with normal occupancy', () => {
    // Wednesday 10:00 UTC, 40% occupancy
    const slotStart = new Date('2026-11-11T10:00:00Z'); // Wednesday
    const result = service.evaluateSlotPricing({ slotStart, chairOccupancyRate: 0.4 });

    expect(result.isPeak).toBe(false);
    expect(result.multiplier).toBe(1.0);
    expect(result.surgeReason).toBe('STANDARD');
    expect(result.surgedPrice(1000)).toBe(1000);
  });

  it('applies EVENING_PEAK multiplier for Friday evening slots', () => {
    // Friday 18:00 UTC
    const slotStart = new Date('2026-11-13T18:00:00Z'); // Friday
    const result = service.evaluateSlotPricing({ slotStart, chairOccupancyRate: 0.5 });

    expect(result.isPeak).toBe(true);
    expect(result.multiplier).toBe(DEFAULT_PEAK_PRICING_CONFIG.eveningPeakMultiplier);
    expect(result.surgeReason).toBe('EVENING_PEAK');
    expect(result.surgedPrice(1000)).toBe(1200); // 1.20 x 1000
  });

  it('applies WEEKEND_PEAK multiplier for Saturday afternoon slots', () => {
    // Saturday 14:00 UTC
    const slotStart = new Date('2026-11-14T14:00:00Z'); // Saturday
    const result = service.evaluateSlotPricing({ slotStart, chairOccupancyRate: 0.6 });

    expect(result.isPeak).toBe(true);
    expect(result.multiplier).toBe(DEFAULT_PEAK_PRICING_CONFIG.weekendPeakMultiplier);
    expect(result.surgeReason).toBe('WEEKEND_PEAK');
    expect(result.surgedPrice(1000)).toBe(1250); // 1.25 x 1000
  });

  it('applies HIGH_OCCUPANCY_SURGE when chair utilization is >= 85% regardless of time', () => {
    // Tuesday 09:00 UTC (normally off-peak), but 90% occupancy
    const slotStart = new Date('2026-11-10T09:00:00Z'); // Tuesday
    const result = service.evaluateSlotPricing({ slotStart, chairOccupancyRate: 0.90 });

    expect(result.isPeak).toBe(true);
    expect(result.multiplier).toBe(DEFAULT_PEAK_PRICING_CONFIG.highOccupancySurgeMultiplier);
    expect(result.surgeReason).toBe('HIGH_OCCUPANCY_SURGE');
    expect(result.surgedPrice(1000)).toBe(1400); // 1.40 x 1000
  });
});
