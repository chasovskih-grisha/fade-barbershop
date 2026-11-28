import { Button } from '@fade/ui';
import type { AvailableSlotDto } from '../types';
import type { DayOption } from '../useBookingFlow';
import { SlotDayTabs } from './SlotDayTabs';
import { SlotsRegion } from './SlotsRegion';

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
  instantSlot?: AvailableSlotDto | null;
  onInstantBook?: (slot: AvailableSlotDto) => void;
}

/** Екран 3 (booking-flow.md): стрічка дат 14 днів, сітка слотів 15 хв;
 * ∅ «На цю дату слотів немає» з підказкою змінити дату/барбера. */
export default function SlotStep(props: Props) {
  const { days, date, loading = false, selectedSlot, onDate, onBack, onNext } = props;

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" onClick={onBack}>
        ← Повернутись
      </Button>
      <h2 className="font-display text-h4">Оберіть слот</h2>
      <SlotDayTabs days={days} date={date} onDate={onDate} />
      <SlotsRegion {...props} loading={loading} />
      <Button disabled={!selectedSlot} onClick={onNext}>
        Далі
      </Button>
    </div>
  );
}
