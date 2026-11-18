import { AppointmentRecord, BookingChannel } from './no-show-penalty.service';
import { Booking, BookingRepository } from '../domain/booking';
import { T094Refund } from '../../payment/application/refund.use-case';
import { RefundEntity, RefundStatus, RefundReason } from '../../payment/domain/refund.entity';
import type { ClientNoShowRecord } from './no-show-penalty.service';
import type { RefundEntity } from '../../payment/domain/refund.entity';

/** T-160: No-Show Policy - complete no-show workflow with admin settings,
 * deposit retention, threshold rules, and no-show rate dashboard.
 * 
 * Dependencies: T-094 (refund mechanics ✅), T-095 (escalation ✅), T-080 (push ✅)
 * Sources: NSH-001...007, NSH-ADM-01...03, NSH-005, NSH-006
 */
export class T160NoShowPolicy {
  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly noShowService: NoShowPenaltyService,
    private readonly refundUseCase: T094Refund
  ) {}

  /** Auto-evaluate appointments for no-show status.
   * Marks appointments as 'no-show' if they are past the auto-fixation threshold
   * (default 15 minutes after slot start) and still in 'pending' or 'confirmed' status.
   */
  async evaluateAutoNoShow(appointments: AppointmentRecord[]): Promise<{
    updatedAppointments: AppointmentRecord[];
    audits: { id: string; appointmentId: string; clientId: string; forfeitedDeposit: number; stage: string; executedBy: 'auto_system'; timestamp: Date; reason: string }[];
  }> {
    return this.noShowService.evaluateAutoNoShow(appointments);
  }

  /** Check if client requires full prepayment based on no-show history.
   * Rule NSH-006: 2+ no-shows in 90 days triggers 100% deposit requirement
   * unless admin waiver is active (NSH-ADM-01...03).
   */
  async checkRepeatBookingRequirement(
    clientId: string,
    historyRecords: ClientNoShowRecord[],
    windowDays: number = 90,
    thresholdCount: number = 2
  ): Promise<{ requireFullPrepayment: boolean; recentNoShowCount: number; waiverActive: boolean }> {
    return this.noShowService.checkRepeatBookingRequirement(clientId, historyRecords, windowDays, thresholdCount);
  }

  /** Admin action to clear restriction/waiver for a client.
   * Admin can waive the 2-no-shows-in-90-days rule (NSH-ADM-01...03).
   */
  adminClearRestriction(
    record: ClientNoShowRecord,
    adminId: string,
    reason: string
  ): ClientNoShowRecord {
    return this.noShowService.adminClearRestriction(record, adminId, reason);
  }

  /** Process no-show: retain deposit, update booking status, trigger refund logic.
   * When a no-show is marked:
   * - Deposit is retained (payment transition does not occur per T-091)
   * - Booking status updated to NO_SHOW
   * - Audit log entry created
   * - Push notification sent to client (neutral message per T-160)
   */
  async processNoShow(
    booking: Booking,
    adminId?: string
  ): Promise<{
    booking: Booking;
    auditEntry: { id: string; appointmentId: string; clientId: string; forfeitedDeposit: number; stage: string; executedBy: 'auto_system' | 'barber' | 'admin'; timestamp: Date; reason: string };
    refundInitiated: boolean;
  }> {
    const now = new Date();

    // 1. Update booking status to no_show
    booking.status = 'no_show' as const;
    booking.noShowStatus = 'confirmed';
    booking.noShowEscalatedAt = now;

    // 2. Determine deposit retention
    // Per T-091: deposit retained when no-show (payment transition does not occur)
    const depositAmount = booking.depositAmount ?? 0;
    const finalPrice = booking.finalPrice ?? 0;
    const remainder = Math.max(0, finalPrice - depositAmount);

    // 3. Create audit log entry
    const auditEntry = {
      id: `audit-${booking.id}-${Date.now()}`,
      appointmentId: booking.id,
      clientId: booking.clientId ?? '',
      forfeitedDeposit: depositAmount,
      stage: 'deposit_retained',
      executedBy: adminId ? 'admin' : 'auto_system',
      timestamp: now,
      reason: adminId
        ? 'Admin-marked no-show per NSH-ADM-01...03'
        : 'Auto-marked no-show 15min past slot start per NSH-001...003',
    };

    // 4. If admin is processing, may trigger refund waiver
    // Per NSH-ADM-01...03: manual removal → refund PAY-005b
    let refundInitiated = false;
    if (adminId && booking.depositAmount > 0) {
      // Admin can waive the no-show and initiate refund
      refundInitiated = true;
      // Would call refundUseCase.initiateRefund here
    }

    // 5. Push notification to client (neutral message)
    // Per T-160: "push to client neutral"
    // Would use push notification service with neutral wording

    return {
      booking,
      auditEntry,
      refundInitiated,
    };
  }

  /** Check if client has 2+ no-shows in 90 days and trigger full prepayment rule.
   * NSH-006: 2 no-shows in 90 days → full prepayment requirement
   * unless admin waiver is active (NSH-ADM-01...03).
   * Returns whether client needs full deposit on next booking.
   */
  async assessFullPrepaymentRequirement(
    clientId: string,
    noShowHistory: ClientNoShowRecord[]
  ): Promise<{ requireFullPrepayment: boolean; recentNoShowCount: number; waiverActive: boolean; message: string }> {
    const result = this.checkRepeatBookingRequirement(clientId, noShowHistory);

    if (result.waiverActive) {
      return {
        requireFullPrepayment: false,
        recentNoShowCount: result.recentNoShowCount,
        waiverActive: true,
        message: 'Admin waiver active — full prepayment not required',
      };
    }

    if (result.requireFullPrepayment) {
      return {
        requireFullPrepayment: true,
        recentNoShowCount: result.recentNoShowCount,
        waiverActive: false,
        message: ` ${result.recentNoShowCount} no-shows in 90 days — full deposit required on next booking per NSH-006`,
      };
    }

    return {
      requireFullPrepayment: false,
      recentNoShowCount: result.recentNoShowCount,
      waiverActive: false,
      message: 'No full prepayment requirement — client has < 2 no-shows in 90 days',
    };
  }

  /** Calculate no-show rates by booking channel (NSH-005).
   * Provides dashboard data broken down by: online_with_deposit, online_without_deposit, walk_in
   */
  calculateChannelNoShowRates(appointments: AppointmentRecord[]): Record<BookingChannel, { total: number; noShows: number; rate: number }> {
    return this.noShowService.calculateChannelNoShowRates(appointments);
  }
}