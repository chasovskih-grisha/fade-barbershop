/** Time slot of a shift change request. */
export interface ShiftChangeSlot {
  date: string;
  start: string;
  end: string;
}

/** Shift change request for booking modifications (T-5012). */
export interface ShiftChangeRequest {
  id: string;
  appointmentId: string;
  clientId: string;
  currentSlot: ShiftChangeSlot;
  requestedSlot?: ShiftChangeSlot;
  status: 'requested' | 'approved' | 'rejected' | 'expired' | 'confirmed';
  requestedAt: Date;
  proposal?: {
    slot: ShiftChangeSlot;
    by: string;
    expiresAt: Date;
  };
  rejection?: {
    by: string;
    reason: string;
  };
  agreement?: {
    clientId: string;
    eventId: string;
    at: Date;
  };
}
