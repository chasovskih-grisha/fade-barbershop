import { forecastBarberRevenue } from './barber-revenue-forecast';

const at = (hour: number, minute: number) => new Date(Date.UTC(2026, 9, 10, hour, minute));

describe('Barber Revenue & Capacity Forecasting Engine', () => {
  it('forecasts revenue, commission tiers, and chair occupancy efficiency accurately', () => {
    const result = forecastBarberRevenue({
      barberId: 'barber-ivan-1',
      operatingStart: at(9, 0),
      operatingEnd: at(17, 0), // 8 hours, 2 chairs = 960 capacity mins
      existingBookings: [
        { start: at(9, 0), end: at(13, 0) }, // 4 hours occupied on chair 1
        { start: at(13, 0), end: at(17, 0) }, // 4 hours occupied on chair 2 (total 8 hours = 480 mins)
      ],
      chairs: 2,
      averageServicePrice: 600,
      averageProductSalesPerBooking: 150,
      baseCommissionRate: 0.40,
    });

    expect(result.utilization.totalCapacityMinutes).toBe(960);
    expect(result.utilization.occupiedMinutes).toBe(480);
    expect(result.utilization.occupancyRate).toBe(0.50); // 50% occupancy -> bronze tier
    expect(result.commissionReport.commissionTier).toBe('bronze');
    expect(result.efficiencyRating).toBe('moderate');
    expect(result.projectedBookingsCount).toBeGreaterThan(0);
    expect(result.totalGrossRevenue).toBeGreaterThan(0);
    expect(result.netBarberEarnings).toBeGreaterThan(0);
    expect(result.shopNetRevenue).toBeGreaterThan(0);
  });
});
