export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type BookingChannel = 'online_with_deposit' | 'online_without_deposit' | 'walk_in';

export interface AppointmentRecord {
  id: string;
  clientId: string;
  locationId: string;
  barberId: string;
  start: Date;
  status: AppointmentStatus;
  channel: BookingChannel;
  totalAmount: number;
  depositAmount: number;
}

export interface NoShowAuditEntry {
  id: string;
  appointmentId: string;
  clientId: string;
  forfeitedDeposit: number;
  stage: string;
  executedBy: 'auto_system' | 'barber' | 'admin';
  timestamp: Date;
  reason?: string;
}

export interface ClientNoShowRecord {
  clientId: string;
  noShowDates: Date[];
  adminWaiverActive?: boolean;
  waiverReason?: string;
  waiverAdminId?: string;
}

export class NoShowPenaltyService {
  /**
   * Automatically evaluates appointments for auto no-show if they are past (start + autoFixMinutes)
   * and still in 'pending' or 'confirmed' status.
   */
  evaluateAutoNoShow(
    appointments: AppointmentRecord[],
    now: Date = new Date(),
    autoFixMinutes: number = 15
  ): { updatedAppointments: AppointmentRecord[]; audits: NoShowAuditEntry[] } {
    const updatedAppointments: AppointmentRecord[] = [];
    const audits: NoShowAuditEntry[] = [];

    for (const appt of appointments) {
      const thresholdTime = new Date(appt.start.getTime() + autoFixMinutes * 60 * 1000);
      const isEligible = (appt.status === 'confirmed' || appt.status === 'pending') && now.getTime() >= thresholdTime.getTime();

      if (isEligible) {
        updatedAppointments.push({
          ...appt,
          status: 'no_show',
        });
        audits.push({
          id: `audit-${Math.random().toString(36).substring(2, 9)}`,
          appointmentId: appt.id,
          clientId: appt.clientId,
          forfeitedDeposit: appt.depositAmount,
          stage: 'automatic_no_show_detection',
          executedBy: 'auto_system',
          timestamp: now,
          reason: `Auto-marked no-show after ${autoFixMinutes}m past slot start time`,
        });
      } else {
        updatedAppointments.push(appt);
      }
    }

    return { updatedAppointments, audits };
  }

  /**
   * Evaluates if client requires 100% full prepayment based on no-show history in rolling window (default 90 days).
   * Rule NSH-006: 2+ no-shows in 90 days triggers 100% deposit requirement unless admin waiver is active.
   */
  checkRepeatBookingRequirement(
    clientId: string,
    historyRecords: ClientNoShowRecord[],
    now: Date = new Date(),
    windowDays: number = 90,
    thresholdCount: number = 2
  ): { requireFullPrepayment: boolean; recentNoShowCount: number; waiverActive: boolean } {
    const clientRecord = historyRecords.find((r) => r.clientId === clientId);
    if (!clientRecord) {
      return { requireFullPrepayment: false, recentNoShowCount: 0, waiverActive: false };
    }

    if (clientRecord.adminWaiverActive) {
      return { requireFullPrepayment: false, recentNoShowCount: 0, waiverActive: true };
    }

    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const recentNoShows = clientRecord.noShowDates.filter((date) => date.getTime() >= windowStart.getTime());
    const recentNoShowCount = recentNoShows.length;

    return {
      requireFullPrepayment: recentNoShowCount >= thresholdCount,
      recentNoShowCount,
      waiverActive: false,
    };
  }

  /**
   * Admin action to clear restriction / waiver active status for a client.
   */
  adminClearRestriction(
    record: ClientNoShowRecord,
    adminId: string,
    reason: string
  ): ClientNoShowRecord {
    return {
      ...record,
      adminWaiverActive: true,
      waiverAdminId: adminId,
      waiverReason: reason,
    };
  }

  /**
   * Calculates no-show rates sliced by booking channel (NSH-005).
   */
  calculateChannelNoShowRates(
    appointments: AppointmentRecord[]
  ): Record<BookingChannel, { total: number; noShows: number; rate: number }> {
    const stats: Record<BookingChannel, { total: number; noShows: number }> = {
      online_with_deposit: { total: 0, noShows: 0 },
      online_without_deposit: { total: 0, noShows: 0 },
      walk_in: { total: 0, noShows: 0 },
    };

    for (const appt of appointments) {
      if (stats[appt.channel]) {
        stats[appt.channel].total += 1;
        if (appt.status === 'no_show') {
          stats[appt.channel].noShows += 1;
        }
      }
    }

    const result: Record<BookingChannel, { total: number; noShows: number; rate: number }> = {} as any;
    for (const channel of Object.keys(stats) as BookingChannel[]) {
      const s = stats[channel];
      const rate = s.total > 0 ? s.noShows / s.total : 0;
      result[channel] = {
        total: s.total,
        noShows: s.noShows,
        rate: Number(rate.toFixed(4)),
      };
    }

    return result;
  }
}
