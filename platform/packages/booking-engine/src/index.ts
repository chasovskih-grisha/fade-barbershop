export * from './protection';

export interface TimeSlot {
  start: string; // ISO string or HH:mm
  end: string;
  barberId: string;
  available: boolean;
}

export interface BookingRequest {
  barberId: string;
  serviceId: string;
  startTime: string; // ISO string
  durationMinutes: number;
  clientTimezone?: string; // e.g. "America/New_York"
}

export interface LockedSlot {
  slotKey: string;
  expiresAt: number; // timestamp
  clientToken: string;
}

export class BookingEngine {
  private appointments: BookingRequest[] = [];
  private lockedSlots: Map<string, LockedSlot> = new Map();
  private shopTimezone: string;
  private cancellationWindowHours: number;

  constructor(shopTimezone: string = 'UTC', cancellationWindowHours: number = 24) {
    this.shopTimezone = shopTimezone;
    this.cancellationWindowHours = cancellationWindowHours;
  }

  // 1. Calendar Slot Locking with TTL & Concurrency check
  public lockSlot(slotKey: string, clientToken: string, ttlMs: number = 300000): boolean {
    const now = Date.now();
    const existing = this.lockedSlots.get(slotKey);

    if (existing && existing.expiresAt > now) {
      if (existing.clientToken !== clientToken) {
        return false; // Already locked by another client
      }
      // Refresh lock for same client
      existing.expiresAt = now + ttlMs;
      return true;
    }

    this.lockedSlots.set(slotKey, {
      slotKey,
      expiresAt: now + ttlMs,
      clientToken,
    });
    return true;
  }

  public releaseSlot(slotKey: string, clientToken: string): boolean {
    const existing = this.lockedSlots.get(slotKey);
    if (existing && existing.clientToken === clientToken) {
      this.lockedSlots.delete(slotKey);
      return true;
    }
    return false;
  }

  // 2. Appointment Scheduling Algorithm with Overlap and Slot Validation
  public bookAppointment(request: BookingRequest, clientToken: string): { success: boolean; error?: string } {
    const slotKey = `${request.barberId}_${request.startTime}`;
    const now = Date.now();

    // Check if locked by someone else
    const lock = this.lockedSlots.get(slotKey);
    if (lock && lock.expiresAt > now && lock.clientToken !== clientToken) {
      return { success: false, error: 'Slot is currently locked by another client.' };
    }

    const startMs = new Date(request.startTime).getTime();
    const endMs = startMs + request.durationMinutes * 60000;

    // Check overlaps with existing appointments for the same barber
    for (const appt of this.appointments) {
      if (appt.barberId !== request.barberId) continue;
      const apptStartMs = new Date(appt.startTime).getTime();
      const apptEndMs = apptStartMs + appt.durationMinutes * 60000;

      if (startMs < apptEndMs && endMs > apptStartMs) {
        return { success: false, error: 'Time slot overlaps with an existing appointment.' };
      }
    }

    // Save appointment
    this.appointments.push(request);
    // Clear lock upon successful booking
    this.lockedSlots.delete(slotKey);

    return { success: true };
  }

  // 3. Time Zone Handling (convert client local start time to shop timezone UTC)
  public convertClientTimeToShopUTC(clientTimeString: string, clientTzOffsetMinutes: number): string {
    // clientTimeString e.g. "2026-11-20T10:00:00"
    // To parse as local time without local JS timezone offset interference, we construct UTC date directly or subtract the offset.
    // If client is at -300 mins (EST, 5 hours behind UTC), 10:00 AM local is 15:00 UTC.
    // So UTC = clientLocal - offset. (- (-300)) = + 300 mins.
    const localDate = new Date(clientTimeString + 'Z'); // parsed as UTC representation of the string numbers
    const utcMs = localDate.getTime() - (clientTzOffsetMinutes * 60000);
    return new Date(utcMs).toISOString();
  }

  // 4. Cancellation Policies (checking if cancellation is within allowed window)
  public canCancelAppointment(appointmentStartTime: string, currentTime: string = new Date().toISOString()): { allowed: boolean; feeApplicable: boolean } {
    const startMs = new Date(appointmentStartTime).getTime();
    const currentMs = new Date(currentTime).getTime();
    const diffHours = (startMs - currentMs) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { allowed: false, feeApplicable: true }; // Already passed
    }

    if (diffHours < this.cancellationWindowHours) {
      return { allowed: true, feeApplicable: true }; // Late cancellation fee applies
    }

    return { allowed: true, feeApplicable: false };
  }

  public getAppointments(): BookingRequest[] {
    return this.appointments;
  }
}
