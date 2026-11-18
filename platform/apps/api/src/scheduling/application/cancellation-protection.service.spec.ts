import { CancellationProtectionService, DEFAULT_CANCELLATION_CONFIG } from './cancellation-protection.service';

describe('CancellationProtectionService (No-Show & Cancellation Protection Specialist)', () => {
  let service: CancellationProtectionService;
  const appointmentStart = new Date('2026-11-15T14:00:00Z');

  beforeEach(() => {
    service = new CancellationProtectionService(DEFAULT_CANCELLATION_CONFIG);
  });

  it('applies FREE cancellation when cancelled > 24 hours in advance', () => {
    const cancelledAt = new Date('2026-11-14T10:00:00Z'); // 28 hours before
    const result = service.assessCancellation({
      appointmentStart,
      cancelledAt,
      servicePrice: 1000,
      clientNoShowCount90d: 0,
      depositPaid: 200,
    });

    expect(result.policyApplied).toBe('FREE');
    expect(result.feeAmount).toBe(0);
    expect(result.refundAmount).toBe(200);
    expect(result.requiresDepositForFuture).toBe(false);
    expect(result.isBookingSuspended).toBe(false);
  });

  it('applies LATE_FEE (50%) when cancelled between 4 and 24 hours in advance', () => {
    const cancelledAt = new Date('2026-11-15T00:00:00Z'); // 14 hours before
    const result = service.assessCancellation({
      appointmentStart,
      cancelledAt,
      servicePrice: 1000,
      clientNoShowCount90d: 1,
      depositPaid: 600,
    });

    expect(result.policyApplied).toBe('LATE_FEE');
    expect(result.feeAmount).toBe(500); // 50% of 1000
    expect(result.refundAmount).toBe(100); // 600 paid - 500 fee
    expect(result.requiresDepositForFuture).toBe(false); // < 2 no-shows
  });

  it('applies NO_SHOW_FORFEIT (100%) when cancelled < 4 hours in advance', () => {
    const cancelledAt = new Date('2026-11-15T12:00:00Z'); // 2 hours before
    const result = service.assessCancellation({
      appointmentStart,
      cancelledAt,
      servicePrice: 1000,
      clientNoShowCount90d: 2, // Meets deposit threshold
      depositPaid: 1000,
    });

    expect(result.policyApplied).toBe('NO_SHOW_FORFEIT');
    expect(result.feeAmount).toBe(1000);
    expect(result.refundAmount).toBe(0);
    expect(result.requiresDepositForFuture).toBe(true);
    expect(result.isBookingSuspended).toBe(false);
  });

  it('suspends booking when client has >= 3 no-shows in 90 days', () => {
    const cancelledAt = new Date('2026-11-15T13:30:00Z');
    const result = service.assessCancellation({
      appointmentStart,
      cancelledAt,
      servicePrice: 1000,
      clientNoShowCount90d: 3,
      depositPaid: 0,
    });

    expect(result.isBookingSuspended).toBe(true);
    expect(result.requiresDepositForFuture).toBe(true);
  });

  it('requires automated deposit for high-value services or repeat no-show clients', () => {
    expect(service.requiresDeposit(1, 2000, 1500)).toBe(true); // High price threshold
    expect(service.requiresDeposit(2, 800, 1500)).toBe(true);  // Repeat no-show threshold
    expect(service.requiresDeposit(0, 800, 1500)).toBe(false); // Clean record & normal price
  });

  it('calculates dynamic turnaround buffer minutes correctly', () => {
    expect(service.calculateDynamicBufferMinutes(30, 0)).toBe(5); // standard service, 0 no-shows -> 5 min
    expect(service.calculateDynamicBufferMinutes(30, 2)).toBe(15); // standard service, 2 no-shows -> 5 + 10 = 15 min
    expect(service.calculateDynamicBufferMinutes(60, 0)).toBe(15); // long service, 0 no-shows -> 5 + 10 = 15 min
    expect(service.calculateDynamicBufferMinutes(60, 1)).toBe(20); // long service, 1 no-shows -> 5 + 5 + 10 = 20 min
  });

  it('waives fees and penalties for excused cancellations', () => {
    const cancelledAt = new Date('2026-11-15T13:50:00Z'); // 10 mins before start
    const result = service.assessCancellation({
      appointmentStart,
      cancelledAt,
      servicePrice: 1000,
      clientNoShowCount90d: 3,
      depositPaid: 500,
      isExcused: true,
    });

    expect(result.policyApplied).toBe('EXCUSED');
    expect(result.feeAmount).toBe(0);
    expect(result.refundAmount).toBe(500);
    expect(result.requiresDepositForFuture).toBe(false);
    expect(result.isBookingSuspended).toBe(false);
  });

  it('waives future deposit requirements for VIP clients with high no-show counts', () => {
    const cancelledAt = new Date('2026-11-15T13:50:00Z');
    const result = service.assessCancellation({
      appointmentStart,
      cancelledAt,
      servicePrice: 1000,
      clientNoShowCount90d: 3,
      depositPaid: 0,
      isVip: true,
    });

    expect(result.requiresDepositForFuture).toBe(false);
    expect(result.isBookingSuspended).toBe(false);
  });
});
