import { Card, Button, SlotPicker, Skeleton } from '@fade/ui';
import type { AvailableSlotDto } from '../types';
import type { DayOption } from '../useBookingFlow';
import { SlotDayTabs } from './SlotDayTabs';
import { EmptySlotsState } from './EmptySlotsState';
import { toSlot, selectedSlotId } from './slot-step-helpers';

interface Props {
  slots: AvailableSlotDto[];
  days: DayOption[];
  date: string;
  loading?: boolean;
  error?: string;
  selectedSlot: AvailableSlotDto | null;
  onDate: (date: string) => void;
  onSelect: (slot: AvailableSlotDto) => void;
  onBack: () => void;
  onNext: () => void;
  onJoinWaitlist?: () => void;
  onCancelWaitlist?: () => void;
  waitlist?: { entryId?: string; queuePosition?: number; estimatedWaitMinutes?: number };
  retrySlots?: () => void;
}

/** Екран 3 (booking-flow.md): стрічка дат 14 днів, сітка слотів 15 хв;
 * ∅ «На цю дату слотів немає» з підказкою змінити дату/барбера. */
export default function SlotStep(props: Props) {
  const {
    slots,
    days,
    date,
    loading = false,
    error,
    selectedSlot,
    onDate,
    onSelect,
    onBack,
    onNext,
    onJoinWaitlist,
    onCancelWaitlist,
    waitlist,
    retrySlots,
  } = props;

  const handleSlotChange = (id: string | undefined) => {
    const slot = slots[Number(id?.split('-')[1] ?? '-1')];
    if (slot) onSelect(slot);
  };

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" onClick={onBack}>
        ← Повернутись
      </Button>
      <h2 className="font-display text-h4">Оберіть слот</h2>
      <SlotDayTabs days={days} date={date} onDate={onDate} />
      {loading && (
        <div aria-busy="true">
          <Skeleton className="h-24" />
        </div>
      )}
      {error && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-fg-secondary">Не вдалося завантажити слоти.</p>
          <Button onClick={retrySlots}>Спробувати ще раз</Button>
        </div>
      )}
      {!loading && slots.length === 0 && (
        <EmptySlotsState
          waitlist={waitlist}
          onJoinWaitlist={onJoinWaitlist}
          onCancelWaitlist={onCancelWaitlist}
          onBack={onBack}
        />
      )}
      {!loading && slots.length > 0 && (
        <Card>
          <SlotPicker
            slots={slots.map(toSlot)}
            value={selectedSlotId(slots, selectedSlot)}
            onChange={handleSlotChange}
          />
        </Card>
      )}
      <Button disabled={!selectedSlot} onClick={onNext}>
        Далі
      </Button>
    </div>
  );
}
