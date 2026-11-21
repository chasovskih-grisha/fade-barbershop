// In-memory waitlist for the public booking flow. There is no Waitlist
// table yet; this keeps join/position/cancel working for the current process.
import type { WaitlistEntryDto } from '../dto/waitlist-entry.dto';

const entries = new Map<string, WaitlistEntryDto>();

export function joinWaitlist(input: { locationId: string; serviceId: string; barberId?: string }): {
  entryId: string;
  queuePosition: number;
} {
  const entry: WaitlistEntryDto = {
    id: `wl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    clientId: 'guest',
    locationId: input.locationId,
    serviceId: input.serviceId,
    barberId: input.barberId,
    status: 'WAITING',
    waitingSince: new Date(),
    vipLevel: 0,
    noShowCount90d: 0,
  };
  entries.set(entry.id, entry);
  return { entryId: entry.id, queuePosition: positionOf(entry.id) };
}

export function waitlistPosition(entryId: string): {
  queuePosition: number;
  estimatedWaitMinutes: number;
} {
  const queuePosition = positionOf(entryId);
  return { queuePosition, estimatedWaitMinutes: queuePosition * 30 };
}

export function cancelWaitlist(entryId: string): { cancelled: boolean } {
  const entry = entries.get(entryId);
  if (entry) entries.set(entryId, { ...entry, status: 'CANCELLED' });
  return { cancelled: true };
}

function positionOf(entryId: string): number {
  const waiting = [...entries.values()]
    .filter((entry) => entry.status === 'WAITING')
    .sort((a, b) => a.waitingSince.getTime() - b.waitingSince.getTime());
  const index = waiting.findIndex((entry) => entry.id === entryId);
  return index === -1 ? 1 : index + 1;
}
