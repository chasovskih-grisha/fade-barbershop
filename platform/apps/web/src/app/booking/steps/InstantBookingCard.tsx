import { Button, Card } from '@fade/ui';
import type { AvailableSlotDto } from '../types';

interface Props {
  slot: AvailableSlotDto;
  onBook: (slot: AvailableSlotDto) => void;
}

/** T-5027: one-tap path from the slot step to confirmation with the soonest chair. */
export default function InstantBookingCard({ slot, onBook }: Props) {
  return (
    <Card>
      <div
        data-testid="instant-booking"
        className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-caption text-fg-secondary">Найближчий вільний час</p>
          <p className="font-display text-h4">
            {slot.start}–{slot.end}
          </p>
        </div>
        <Button onClick={() => onBook(slot)}>Записатися зараз</Button>
      </div>
    </Card>
  );
}
