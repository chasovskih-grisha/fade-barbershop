export type LegRequest = { barberId: string; slot: { start: string; end: string } | undefined };

export interface CreateAppointmentPartyDto {
  date: string;
  mode: 'sequential' | 'parallel';
  barberIds: [string, string];
  slots: { start: string; end: string }[];
  partyLegs: { id: string; role: 'father' | 'son'; name: string; age: number; barberId: string }[];
  locationId: string;
  serviceId: string;
}

export function withinWindow(
  windows: { start: string; end: string }[],
  start: Date,
  end: Date
): boolean {
  const startTime = start.toISOString().slice(11, 16);
  const endTime = end.toISOString().slice(11, 16);
  return windows.some((window) => window.start <= startTime && window.end >= endTime);
}

export function openFor(
  hour: { closed: boolean; open: string | null; close: string | null } | null,
  start: Date,
  end: Date
): boolean {
  if (!hour || hour.closed || !hour.open || !hour.close) return false;
  const startTime = start.toISOString().slice(11, 16);
  const endTime = end.toISOString().slice(11, 16);
  return hour.open <= startTime && hour.close >= endTime;
}

export function parsePartySlot(request: LegRequest): { start: Date; end: Date } {
  if (!request.slot) throw new Error('A time slot is required for every party leg');
  const start = new Date(request.slot.start);
  const end = new Date(request.slot.end);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start.toISOString().slice(0, 10) !== end.toISOString().slice(0, 10)
  ) {
    throw new Error('Party slots must use valid times on the same day');
  }
  return { start, end };
}
