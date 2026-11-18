import { NoShowEscrowSettlementService } from './no-show-escrow-settlement';

describe('NoShowEscrowSettlementService (No-Show & Cancellation Protection Specialist)', () => {
  let service: NoShowEscrowSettlementService;

  beforeEach(() => {
    service = new NoShowEscrowSettlementService();
  });

  it('settles escrow with full refund when appointment is completed', () => {
    const record = service.settleEscrow({
      appointmentId: 'appt-1',
      clientId: 'client-1',
      barberId: 'barber-1',
      depositAmount: 300,
      servicePrice: 1000,
      appointmentStatus: 'completed',
    });

    expect(record.escrowStatus).toBe('SETTLED_REFUND');
    expect(record.refundAmount).toBe(300);
    expect(record.feeAmount).toBe(0);
    expect(record.auditNotes).toContain('Full deposit');
  });

  it('settles escrow with full refund when appointment is cancelled under FREE policy', () => {
    const record = service.settleEscrow({
      appointmentId: 'appt-2',
      clientId: 'client-2',
      barberId: 'barber-1',
      depositAmount: 300,
      servicePrice: 1000,
      appointmentStatus: 'cancelled',
      policyApplied: 'FREE',
    });

    expect(record.escrowStatus).toBe('SETTLED_REFUND');
    expect(record.refundAmount).toBe(300);
    expect(record.feeAmount).toBe(0);
  });

  it('settles escrow with partial refund and late fee when cancelled under LATE_FEE policy', () => {
    const record = service.settleEscrow({
      appointmentId: 'appt-3',
      clientId: 'client-3',
      barberId: 'barber-1',
      depositAmount: 500,
      servicePrice: 1000,
      appointmentStatus: 'cancelled',
      policyApplied: 'LATE_FEE',
      feeAmount: 250,
    });

    expect(record.escrowStatus).toBe('PARTIAL_REFUND');
    expect(record.feeAmount).toBe(250);
    expect(record.refundAmount).toBe(250);
  });

  it('settles escrow with 100% forfeiture when appointment is marked no_show', () => {
    const record = service.settleEscrow({
      appointmentId: 'appt-4',
      clientId: 'client-4',
      barberId: 'barber-1',
      depositAmount: 400,
      servicePrice: 1000,
      appointmentStatus: 'no_show',
    });

    expect(record.escrowStatus).toBe('SETTLED_FORFEIT');
    expect(record.feeAmount).toBe(400);
    expect(record.refundAmount).toBe(0);
    expect(record.auditNotes).toContain('No-show recorded');
  });

  it('summarizes settlements across multiple escrow records correctly', () => {
    const r1 = service.settleEscrow({
      appointmentId: 'a1',
      clientId: 'c1',
      barberId: 'b1',
      depositAmount: 300,
      servicePrice: 1000,
      appointmentStatus: 'completed',
    });
    const r2 = service.settleEscrow({
      appointmentId: 'a2',
      clientId: 'c2',
      barberId: 'b1',
      depositAmount: 400,
      servicePrice: 1000,
      appointmentStatus: 'no_show',
    });
    const r3 = service.settleEscrow({
      appointmentId: 'a3',
      clientId: 'c3',
      barberId: 'b1',
      depositAmount: 500,
      servicePrice: 1000,
      appointmentStatus: 'cancelled',
      policyApplied: 'LATE_FEE',
      feeAmount: 250,
    });

    const summary = service.summarizeSettlements([r1, r2, r3]);

    expect(summary.totalHeld).toBe(1200); // 300 + 400 + 500
    expect(summary.totalRefunded).toBe(550); // 300 (completed) + 250 (partial cancel refund)
    expect(summary.totalForfeited).toBe(650); // 400 (no-show) + 250 (late fee)
    expect(summary.totalFeesCollected).toBe(650);
  });
});
