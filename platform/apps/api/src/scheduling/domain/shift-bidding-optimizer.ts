// Optimization entry point and shift-change request lifecycle (T-5012).
export { optimizeShiftBidding } from './shift-bidding-assignment';

import { DEFAULT_PROPOSAL_WINDOW_MINUTES } from './shift-bidding-constants';
import type { ShiftChangeRequest, ShiftChangeSlot } from './shift-change-request.types';

/** Creates a shift change request for booking modifications. */
export function createShiftChangeRequest(input: {
  id: string;
  appointmentId: string;
  clientId: string;
  currentSlot: ShiftChangeSlot;
  requestedSlot?: ShiftChangeSlot;
  at?: Date;
}): ShiftChangeRequest {
  const request: ShiftChangeRequest = {
    id: input.id,
    appointmentId: input.appointmentId,
    clientId: input.clientId,
    currentSlot: input.currentSlot,
    status: 'requested',
    requestedAt: input.at ?? new Date(),
  };

  if (input.requestedSlot) {
    request.requestedSlot = input.requestedSlot;
  }

  return request;
}

/** Approves a shift change request. */
export function approveShiftChangeRequest(
  request: ShiftChangeRequest,
  input: { by: string; slot?: ShiftChangeSlot; at?: Date }
): ShiftChangeRequest {
  return {
    ...request,
    status: 'approved',
    ...(input.slot
      ? {
          proposal: {
            slot: input.slot,
            by: input.by,
            expiresAt: new Date(
              (input.at ?? new Date()).getTime() + DEFAULT_PROPOSAL_WINDOW_MINUTES * 60_000
            ),
          },
        }
      : {}),
  };
}

/** Rejects a shift change request. */
export function rejectShiftChangeRequest(
  request: ShiftChangeRequest,
  input: { by: string; reason: string }
): ShiftChangeRequest {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error('Rejection requires a reason');
  }

  return {
    ...request,
    status: 'rejected',
    rejection: { by: input.by, reason },
  };
}

/** Confirms a shift change agreement (client agreement). */
export function confirmShiftChangeAgreement(
  request: ShiftChangeRequest,
  input: { clientId: string; eventId: string; at?: Date; slotTaken?: boolean }
): { request: ShiftChangeRequest; alreadyConfirmed: boolean } {
  if (input.clientId !== request.clientId) {
    throw new Error('Only the requesting client can confirm the change');
  }

  if (request.agreement?.eventId === input.eventId) {
    return { request, alreadyConfirmed: true };
  }

  if (request.agreement) {
    throw new Error('Change request is already confirmed');
  }

  if (request.status !== 'approved' || !request.proposal) {
    throw new Error(`Only an approved change can be confirmed (current: ${request.status})`);
  }

  return {
    request: {
      ...request,
      status: 'confirmed',
      agreement: {
        clientId: input.clientId,
        at: input.at ?? new Date(),
        eventId: input.eventId,
      },
    },
    alreadyConfirmed: false,
  };
}
