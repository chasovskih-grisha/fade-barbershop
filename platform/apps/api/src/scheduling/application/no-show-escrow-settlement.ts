/**
 * No-Show Escrow Settlement & Audit Service
 * FADE Platform — Cancellation & No-Show Protection Specialist
 */

export type EscrowStatus = 'HELD' | 'SETTLED_REFUND' | 'SETTLED_FORFEIT' | 'PARTIAL_REFUND';

export interface EscrowSettlementRecord {
  appointmentId: string;
  clientId: string;
  barberId: string;
  depositAmount: number;
  servicePrice: number;
  appointmentStatus: 'completed' | 'cancelled' | 'no_show';
  cancellationPolicyApplied?: 'FREE' | 'LATE_FEE' | 'NO_SHOW_FORFEIT' | 'EXCUSED';
  feeAmount: number;
  refundAmount: number;
  escrowStatus: EscrowStatus;
  settledAt: Date;
  auditNotes: string;
}

export class NoShowEscrowSettlementService {
  /**
   * Settles deposit escrow upon appointment lifecycle completion, cancellation, or no-show.
   */
  settleEscrow(
    input: {
      appointmentId: string;
      clientId: string;
      barberId: string;
      depositAmount: number;
      servicePrice: number;
      appointmentStatus: 'completed' | 'cancelled' | 'no_show';
      policyApplied?: 'FREE' | 'LATE_FEE' | 'NO_SHOW_FORFEIT' | 'EXCUSED';
      feeAmount?: number;
    },
    settledAt: Date = new Date()
  ): EscrowSettlementRecord {
    const deposit = input.depositAmount;
    let fee = input.feeAmount ?? 0;
    let refundAmount = 0;
    let escrowStatus: EscrowStatus = 'HELD';
    let auditNotes = '';

    if (input.appointmentStatus === 'completed') {
      // Completed appointments: 100% deposit credited/refunded back to client (or applied to final bill)
      refundAmount = deposit;
      fee = 0;
      escrowStatus = 'SETTLED_REFUND';
      auditNotes = `Appointment completed successfully. Full deposit of ${deposit} refunded/credited to client.`;
    } else if (input.appointmentStatus === 'cancelled') {
      if (input.policyApplied === 'FREE' || input.policyApplied === 'EXCUSED') {
        refundAmount = deposit;
        fee = 0;
        escrowStatus = 'SETTLED_REFUND';
        auditNotes = `Cancelled under ${input.policyApplied} policy. Full deposit of ${deposit} returned.`;
      } else {
        // LATE_FEE or NO_SHOW_FORFEIT
        fee = Math.min(deposit, fee);
        refundAmount = Math.max(0, deposit - fee);
        escrowStatus = refundAmount > 0 ? 'PARTIAL_REFUND' : 'SETTLED_FORFEIT';
        auditNotes = `Cancelled under ${input.policyApplied} policy. Fee assessed: ${fee}, Refund issued: ${refundAmount}.`;
      }
    } else if (input.appointmentStatus === 'no_show') {
      // No-show: 100% deposit forfeited to shop/barber escrow
      fee = deposit;
      refundAmount = 0;
      escrowStatus = 'SETTLED_FORFEIT';
      auditNotes = `No-show recorded. Full deposit of ${deposit} forfeited to salon escrow.`;
    }

    return {
      appointmentId: input.appointmentId,
      clientId: input.clientId,
      barberId: input.barberId,
      depositAmount: deposit,
      servicePrice: input.servicePrice,
      appointmentStatus: input.appointmentStatus,
      cancellationPolicyApplied: input.policyApplied as 'FREE' | 'LATE_FEE' | 'NO_SHOW_FORFEIT' | 'EXCUSED',
      feeAmount: fee,
      refundAmount,
      escrowStatus,
      settledAt,
      auditNotes,
    };
  }

  /**
   * Summarizes escrow settlements for financial auditing and reconciliation.
   */
  summarizeSettlements(records: EscrowSettlementRecord[]): {
    totalHeld: number;
    totalRefunded: number;
    totalForfeited: number;
    totalFeesCollected: number;
  } {
    let totalHeld = 0;
    let totalRefunded = 0;
    let totalForfeited = 0;
    let totalFeesCollected = 0;

    for (const rec of records) {
      totalHeld += rec.depositAmount;
      totalRefunded += rec.refundAmount;
      if (rec.escrowStatus === 'SETTLED_FORFEIT' || rec.escrowStatus === 'PARTIAL_REFUND') {
        totalForfeited += rec.feeAmount;
      }
      totalFeesCollected += rec.feeAmount;
    }

    return {
      totalHeld,
      totalRefunded,
      totalForfeited,
      totalFeesCollected,
    };
  }
}
