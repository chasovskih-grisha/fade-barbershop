import type { Slot as UiSlot } from '@fade/ui/dist/SlotPicker';
import type { AvailableSlotDto } from '../types';

/** Barbers: [] means the chairs are taken — the slot stays visible but disabled (screen 3). */
export function toSlot(slot: AvailableSlotDto, index: number): UiSlot {
  return {
    id: `slot-${index}`,
    time: `${slot.start} – ${slot.end}`,
    state: slot.barbers.length ? 'free' : 'busy',
  };
}

export function selectedSlotId(
  slots: AvailableSlotDto[],
  selected: AvailableSlotDto | null
): string | null {
  if (!selected) return null;
  const index = slots.findIndex(
    (slot) => slot.start === selected.start && slot.end === selected.end
  );
  return index >= 0 ? `slot-${index}` : null;
}
