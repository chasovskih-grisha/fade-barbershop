export interface DepositRule {
  minServicePrice: number;
  depositPercentage: number; // e.g. 30 for 30%
  flatAmount?: number;
}

export type DepositStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FORFEITED';

export interface DepositRecord {
  appointmentId: string;
  clientId: string;
  amount: number;
  status: DepositStatus;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  clientId: string;
  barberId: string;
  preferredStartTime: string; // ISO string
  flexibleHours: number; // e.g. +/- 2 hours
  priorityScore: number;
  status: 'WAITING' | 'NOTIFIED' | 'PROMOTED' | 'EXPIRED' | 'DECLINED';
  notifiedAt?: number; // timestamp
  expiresAt?: number; // timestamp for notification response TTL
}

export interface ClientPenaltyRecord {
  clientId: string;
  noShowCount: number;
  lateCancellationCount: number;
  strikes: number;
  isSuspended: boolean;
  suspendedUntil?: string;
}

export class CancellationProtectionManager {
  private depositRules: DepositRule;
  private deposits: Map<string, DepositRecord> = new Map();
  private waitlist: WaitlistEntry[] = [];
  private penalties: Map<string, ClientPenaltyRecord> = new Map();
  private maxStrikes: number;
  private notificationTtlMs: number;

  constructor(
    depositRules: DepositRule = { minServicePrice: 50, depositPercentage: 30 },
    maxStrikes: number = 3,
    notificationTtlMs: number = 1800000 // 30 minutes
  ) {
    this.depositRules = depositRules;
    this.maxStrikes = maxStrikes;
    this.notificationTtlMs = notificationTtlMs;
  }

  // 1. Automated Deposit Requirements
  public calculateRequiredDeposit(servicePrice: number): number {
    if (servicePrice < this.depositRules.minServicePrice) {
      return 0;
    }
    if (this.depositRules.flatAmount !== undefined) {
      return this.depositRules.flatAmount;
    }
    return Math.round((servicePrice * this.depositRules.depositPercentage) / 100);
  }

  public createDeposit(appointmentId: string, clientId: string, servicePrice: number): DepositRecord {
    const amount = this.calculateRequiredDeposit(servicePrice);
    const record: DepositRecord = {
      appointmentId,
      clientId,
      amount,
      status: amount > 0 ? 'PENDING' : 'REFUNDED',
      createdAt: new Date().toISOString(),
    };
    this.deposits.set(appointmentId, record);
    return record;
  }

  public markDepositPaid(appointmentId: string): boolean {
    const deposit = this.deposits.get(appointmentId);
    if (deposit && deposit.status === 'PENDING') {
      deposit.status = 'PAID';
      return true;
    }
    return false;
  }

  public resolveDepositOnCancellation(appointmentId: string, isLateCancellation: boolean, isNoShow: boolean): DepositStatus {
    const deposit = this.deposits.get(appointmentId);
    if (!deposit || deposit.status !== 'PAID') {
      return deposit ? deposit.status : 'REFUNDED';
    }

    if (isNoShow || isLateCancellation) {
      deposit.status = 'FORFEITED'; // Retained as protection fee
    } else {
      deposit.status = 'REFUNDED'; // Timely cancellation refunded
    }
    return deposit.status;
  }

  // 2. Waitlist Auto-Promotion Logic
  public addToWaitlist(entry: Omit<WaitlistEntry, 'status'>): WaitlistEntry {
    const fullEntry: WaitlistEntry = {
      ...entry,
      status: 'WAITING',
    };
    this.waitlist.push(fullEntry);
    // Sort waitlist by priorityScore descending, then by request time
    this.waitlist.sort((a, b) => b.priorityScore - a.priorityScore);
    return fullEntry;
  }

  public processCancellationAndPromote(barberId: string, cancelledStartTime: string): WaitlistEntry | null {
    const now = Date.now();
    const cancelledTimeMs = new Date(cancelledStartTime).getTime();

    // Find first WAITING entry matching barber and time window
    for (const entry of this.waitlist) {
      if (entry.status === 'WAITING' && entry.barberId === barberId) {
        const preferredMs = new Date(entry.preferredStartTime).getTime();
        const flexWindowMs = entry.flexibleHours * 3600000;

        // Check if cancelled slot falls within client's flexible window
        if (Math.abs(cancelledTimeMs - preferredMs) <= flexWindowMs) {
          entry.status = 'NOTIFIED';
          entry.notifiedAt = now;
          entry.expiresAt = now + this.notificationTtlMs;
          return entry;
        }
      }
    }
    return null;
  }

  public respondToWaitlistOffer(entryId: string, accept: boolean): boolean {
    const entry = this.waitlist.find((e) => e.id === entryId);
    if (!entry || entry.status !== 'NOTIFIED') {
      return false;
    }

    if (Date.now() > (entry.expiresAt || 0)) {
      entry.status = 'EXPIRED';
      return false;
    }

    entry.status = accept ? 'PROMOTED' : 'DECLINED';
    return accept;
  }

  // 3. No-Show Penalty & Strike Management
  public recordNoShowOrLateCancellation(clientId: string, isNoShow: boolean): ClientPenaltyRecord {
    let record = this.penalties.get(clientId);
    if (!record) {
      record = {
        clientId,
        noShowCount: 0,
        lateCancellationCount: 0,
        strikes: 0,
        isSuspended: false,
      };
      this.penalties.set(clientId, record);
    }

    if (isNoShow) {
      record.noShowCount += 1;
      record.strikes += 2; // No-show counts as 2 strikes
    } else {
      record.lateCancellationCount += 1;
      record.strikes += 1; // Late cancellation counts as 1 strike
    }

    if (record.strikes >= this.maxStrikes) {
      record.isSuspended = true;
      record.suspendedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 day suspension
    }

    return record;
  }

  public getClientPenalty(clientId: string): ClientPenaltyRecord | undefined {
    return this.penalties.get(clientId);
  }

  public getWaitlist(): WaitlistEntry[] {
    return this.waitlist;
  }
}
