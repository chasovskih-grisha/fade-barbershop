import { calculateBarberCommissionAndPayout } from './barber-commission-tier';

describe('BarberCommissionTier', () => {
  it('calculates standard tier commission for low occupancy (<50%)', () => {
    const result = calculateBarberCommissionAndPayout({
      barberId: 'barber-1',
      baseServiceRevenue: 1000,
      productSalesRevenue: 200,
      tipsAmount: 100,
      occupancyRate: 0.35,
    });

    expect(result.commissionTier).toBe('standard');
    expect(result.appliedCommissionRate).toBe(0.40);
    expect(result.serviceCommissionAmount).toBe(400); // 1000 * 0.40
    expect(result.productCommissionAmount).toBe(30); // 200 * 0.15
    expect(result.bonusMultiplier).toBe(1.0);
    expect(result.bonusPayoutAmount).toBe(0);
    expect(result.tipsAmount).toBe(100);
    expect(result.totalPayoutAmount).toBe(530); // 400 + 30 + 100
  });

  it('calculates bronze tier commission for occupancy between 50% and 69%', () => {
    const result = calculateBarberCommissionAndPayout({
      barberId: 'barber-2',
      baseServiceRevenue: 1000,
      productSalesRevenue: 0,
      tipsAmount: 50,
      occupancyRate: 0.60,
    });

    expect(result.commissionTier).toBe('bronze');
    expect(result.appliedCommissionRate).toBe(0.425);
    expect(result.serviceCommissionAmount).toBe(425);
    expect(result.bonusMultiplier).toBe(1.05);
    expect(result.bonusPayoutAmount).toBe(21.25); // 425 * 0.05
    expect(result.totalPayoutAmount).toBe(496.25); // 425 + 21.25 + 50
  });

  it('calculates silver tier commission for occupancy between 70% and 84%', () => {
    const result = calculateBarberCommissionAndPayout({
      barberId: 'barber-3',
      baseServiceRevenue: 2000,
      productSalesRevenue: 500,
      tipsAmount: 150,
      occupancyRate: 0.78,
    });

    expect(result.commissionTier).toBe('silver');
    expect(result.appliedCommissionRate).toBe(0.45);
    expect(result.serviceCommissionAmount).toBe(900); // 2000 * 0.45
    expect(result.productCommissionAmount).toBe(75); // 500 * 0.15
    expect(result.bonusMultiplier).toBe(1.10);
    // subtotal = 975, bonus = 975 * 0.10 = 97.50
    expect(result.bonusPayoutAmount).toBe(97.50);
    expect(result.totalPayoutAmount).toBe(1222.50); // 975 + 97.50 + 150
  });

  it('calculates gold tier commission for occupancy >= 85%', () => {
    const result = calculateBarberCommissionAndPayout({
      barberId: 'barber-4',
      baseServiceRevenue: 3000,
      productSalesRevenue: 1000,
      tipsAmount: 300,
      occupancyRate: 0.90,
    });

    expect(result.commissionTier).toBe('gold');
    expect(result.appliedCommissionRate).toBe(0.50);
    expect(result.serviceCommissionAmount).toBe(1500); // 3000 * 0.50
    expect(result.productCommissionAmount).toBe(150); // 1000 * 0.15
    expect(result.bonusMultiplier).toBe(1.20);
    // subtotal = 1650, bonus = 1650 * 0.20 = 330
    expect(result.bonusPayoutAmount).toBe(330);
    expect(result.totalPayoutAmount).toBe(2280); // 1650 + 330 + 300
  });
});
