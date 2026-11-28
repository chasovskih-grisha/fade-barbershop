import { Card, Button, SlotPicker, Skeleton } from '@fade/ui';
import type { AvailableSlotDto } from '../types';
import { EmptySlotsState } from './EmptySlotsState';
import { toSlot, selectedSlotId } from './slot-step-helpers';
import InstantBookingCard from './InstantBookingCard';

interface Props {
  slots: AvailableSlotDto[];
  loading: boolean;
  error?: string;
  selectedSlot: AvailableSlotDto | null;
  onSelect: (slot: AvailableSlotDto) => void;
  onBack: () => void;
  onJoinWaitlist?: () => void;
  onCancelWaitlist?: () => void;
  waitlist?: { entryId?: string; queuePosition?: number; estimatedWaitMinutes?: number };
  retrySlots?: () => void;
  instantSlot?: AvailableSlotDto | null;
  onInstantBook?: (slot: AvailableSlotDto) => void;
}

/** Тіло екрана 3: стан завантаження/помилки/порожнечі/сітки — ранніми виходами,
 * щоб кожен стан читався окремо (booking-flow.md екран 3). */
export function SlotsRegion(props: Props) {
  const {
    slots,
    loading,
    error,
    selectedSlot,
    onSelect,
    onBack,
    onJoinWaitlist,
    onCancelWaitlist,
    waitlist,
    retrySlots,
    instantSlot,
    onInstantBook,
  } = props;

  const handleSlotChange = (id: string | undefined) => {
    const slot = slots[Number(id?.split('-')[1] ?? '-1')];
    if (slot) onSelect(slot);
  };

  if (loading) {
    return (
      <div aria-busy="true">
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-fg-secondary">Не вдалося завантажити слоти.</p>
        <Button onClick={retrySlots}>Спробувати ще раз</Button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <EmptySlotsState
        waitlist={waitlist}
        onJoinWaitlist={onJoinWaitlist}
        onCancelWaitlist={onCancelWaitlist}
        onBack={onBack}
      />
    );
  }

  return (
    <>
      {instantSlot && onInstantBook && (
        <InstantBookingCard slot={instantSlot} onBook={onInstantBook} />
      )}
      <Card>
        <SlotPicker
          slots={slots.map(toSlot)}
          value={selectedSlotId(slots, selectedSlot)}
          onChange={handleSlotChange}
        />
      </Card>
    </>
  );
}
