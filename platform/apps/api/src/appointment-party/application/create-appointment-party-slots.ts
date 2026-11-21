import { Slot } from '../domain/slot.value-object';
import type { AppointmentMode } from '../domain/appointment-party.entity';

export interface PartySlotInput {
  mode: AppointmentMode;
  slots: { start: Date; end: Date }[];
}

export function assertAndBuildSlots(input: PartySlotInput): Slot[] {
  if (input.mode === 'sequential') {
    return assertSequentialSlots(input);
  }
  if (input.mode === 'parallel') {
    return assertParallelSlots(input);
  }
  throw new Error('Invalid appointment mode');
}

function assertSequentialSlots(input: PartySlotInput): Slot[] {
  if (input.slots.length !== 1) {
    throw new Error('Sequential mode requires exactly one slot (PARTY-005)');
  }
  const [raw] = input.slots;
  if (!raw) {
    throw new Error('Sequential mode requires exactly one slot (PARTY-005)');
  }
  const slot = Slot.create(raw.start, raw.end);
  if (slot.durationMinutes !== 90) {
    throw new Error('Sequential slot must be 90 minutes (PARTY-005)');
  }
  return [slot];
}

function assertParallelSlots(input: PartySlotInput): Slot[] {
  if (input.slots.length !== 2) {
    throw new Error('Parallel mode requires exactly two slots (PARTY-005)');
  }
  const [s1, s2] = input.slots.map((s) => Slot.create(s.start, s.end));
  if (s1?.start?.getTime() !== s2?.start?.getTime()) {
    throw new Error('Parallel slots must share the same start time (PARTY-005)');
  }
  if (s1?.durationMinutes !== 50 || s2?.durationMinutes !== 45) {
    throw new Error(
      'Parallel slots must be 50 minutes for father and 45 minutes for son (PARTY-005)'
    );
  }
  return [s1, s2].filter((s): s is Slot => !!s);
}
