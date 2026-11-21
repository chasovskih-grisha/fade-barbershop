/* eslint-disable max-lines, max-params -- cohesive module (150 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 2 signatures whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
import { AppointmentRecord, BookingChannel, NoShowPenaltyService } from './no-show-penalty.service';
import { Booking, BookingRepository } from '../domain/booking';
import { T094Refund } from '../../payment/application/refund.use-case';
import { RefundEntity } from '../../payment/domain/refund.entity';
import type { ClientNoShowRecord, NoShowAuditEntry } from './no-show-penalty.service';

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
    private readonly refundUseCase: T094Refund,
    private readonly now: () => Date = () => new Date()
  ) {}

  /** Auto-evaluate appointments for no-show status.
   * Marks appointments as 'no-show' if they are past the auto-fixation threshold
   * (default 15 minutes after slot start) and still in 'pending' or 'confirmed' status.
   */
  async evaluateAutoNoShow(appointments: AppointmentRecord[]): Promise<{
    updatedAppointments: AppointmentRecord[];
    audits: Array<{
      id: string;
      appointmentId: string;
      clientId: string;
      forfeitedDeposit: number;
      stage: string;
      executedBy: 'auto_system' | 'barber' | 'admin';
      timestamp: Date;
      reason?: string;
    }>;
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
    return this.noShowService.checkRepeatBookingRequirement(
      clientId,
      historyRecords,
      new Date(),
      windowDays,
      thresholdCount
    );
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
    adminId?: string,
    reason?: string
  ): Promise<{
    booking: Booking;
    auditEntry: NoShowAuditEntry;
    refundInitiated: false;
  }> {
    const now = this.now();

    // NSH-003: no-show утримує депозит — перехід платежу не відбувається
    // і refund тут не викликається (він можливий лише зняттям no-show).
    booking.status = 'no_show';
    booking.noShowStatus = 'confirmed';
    booking.noShowEscalatedAt = now;
    await this.bookingRepo.save(booking);

    const auditEntry: NoShowAuditEntry = {
      id: `audit-${booking.id}-${now.getTime()}`,
      appointmentId: booking.id,
      clientId: booking.clientId ?? '',
      forfeitedDeposit: booking.deposit?.amount ?? 0,
      stage: 'deposit_retained',
      executedBy: adminId ? 'admin' : 'auto_system',
      timestamp: now,
      reason:
        reason?.trim() ||
        (adminId
          ? 'Admin-marked no-show per NSH-ADM-01...03'
          : 'Auto-marked no-show 15min past slot start per NSH-001...003'),
    };

    return { booking, auditEntry, refundInitiated: false };
  }

  /**
   * NSH-ADM-03 / PAY-005б: адмін знімає прапор no-show — депозит повертається
   * через T-094 (лише захоплена сума, перший коміт виграє, видатковий чек).
   * Без причини зняття немає: лог обов'язковий.
   */
  async removeNoShow(
    booking: Booking,
    input: { adminId: string; reason: string; at?: Date }
  ): Promise<{
    booking: Booking;
    refund: RefundEntity;
    isDuplicate: boolean;
    auditEntry: NoShowAuditEntry;
  }> {
    const reason = input.reason?.trim();
    if (!reason) throw new Error('Removal reason is required (NSH-ADM-03)');
    if (!input.adminId) throw new Error('Admin id is required to remove a no-show');

    const { refund, isDuplicate } = await this.refundUseCase.initiateRefund(
      booking.id,
      undefined,
      'NSH-ADM-03',
      `ns_remove_${booking.id}`
    );

    const now = input.at ?? this.now();
    booking.noShowStatus = 'removed';
    await this.bookingRepo.save(booking);

    const auditEntry: NoShowAuditEntry = {
      id: `audit-${booking.id}-${now.getTime()}`,
      appointmentId: booking.id,
      clientId: booking.clientId ?? '',
      forfeitedDeposit: 0,
      stage: 'no_show_removed',
      executedBy: 'admin',
      timestamp: now,
      reason: `${reason}; refund ${refund.refundId} (${refund.status})`,
    };

    return { booking, refund, isDuplicate, auditEntry };
  }

  /** Check if client has 2+ no-shows in 90 days and trigger full prepayment rule.
   * NSH-006: 2 no-shows in 90 days → full prepayment requirement
   * unless admin waiver is active (NSH-ADM-01...03).
   * Returns whether client needs full deposit on next booking.
   */
  async assessFullPrepaymentRequirement(
    clientId: string,
    noShowHistory: ClientNoShowRecord[]
  ): Promise<{
    requireFullPrepayment: boolean;
    recentNoShowCount: number;
    waiverActive: boolean;
    message: string;
  }> {
    const result = await this.checkRepeatBookingRequirement(clientId, noShowHistory);

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
  calculateChannelNoShowRates(
    appointments: AppointmentRecord[]
  ): Record<BookingChannel, { total: number; noShows: number; rate: number }> {
    return this.noShowService.calculateChannelNoShowRates(appointments);
  }
}
