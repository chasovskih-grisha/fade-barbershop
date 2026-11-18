import { Card, Button, SlotPicker, Skeleton } from '@fade/ui';
import type { Slot as UiSlot } from "@fade/ui/dist/SlotPicker";
import { AvailableSlotDto } from '../types';
import type { DayOption } from '../useBookingFlow';

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

function toSlot(slot: AvailableSlotDto, index: number): UiSlot {
  // barbers: [] — крісла зайняті: слот лишається у стрічці disabled (екран 3).
  return {
    id: `slot-${index}`,
    time: `${slot.start} – ${slot.end}`,
    state: slot.barbers.length ? 'free' : 'busy',
  };
}

function selectedSlotId(slots: AvailableSlotDto[], selected: AvailableSlotDto | null): string | null {
  if (!selected) return null;
  const index = slots.findIndex((slot) => slot.start === selected.start && slot.end === selected.end);
  return index >= 0 ? `slot-${index}` : null;
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
  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" onClick={onBack}>
        ← Повернутись
      </Button>
      <h2 className="font-display text-h4">Оберіть слот</h2>
      <div
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-none [-webkit-overflow-scrolling:touch]"
        role="tablist"
        aria-label="Дата візиту"
      >
        {days.map((day) => (
          <button
            key={day.date}
            role="tab"
            aria-selected={day.date === date}
            onClick={() => onDate(day.date)}
            // prettier-ignore
            className={`whitespace-nowrap rounded-pill border border-line px-3 py-1 text-sm ${day.date === date ? 'bg-fg text-surface' : 'bg-surface hover:bg-interactive'}`}
          >
            {`${day.label} ${day.date.slice(8)}.${day.date.slice(5, 7)}`}
          </button>
        ))}
      </div>
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
        <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface-raised p-4 text-center">
          <p className="font-display text-bodyLg">На цю дату слотів немає</p>
          <p className="text-sm text-fg-secondary">Спробуйте іншу дату або іншого барбера.</p>
          {waitlist?.entryId && (
            <div className="flex flex-col items-center gap-2 my-2">
              <p className="text-sm text-fg-secondary">Ви в черзі очікування</p>
              <p className="font-display text-h5">
                {waitlist.queuePosition ?? ''}-й місце
              </p>
              <p className="text-sm text-fg-secondary">
                Очікувано {waitlist.estimatedWaitMinutes ?? ''} хв
              </p>
              <Button variant="secondary" onClick={onCancelWaitlist}>
                Скасувати запис
              </Button>
            </div>
          )}
          {!waitlist?.entryId && onJoinWaitlist && (
            <Button variant="primary" onClick={onJoinWaitlist} className="mb-2">
              Приєднатися до черги очікування
            </Button>
          )}
          <Button variant="secondary" onClick={onBack}>
            Обрати іншого барбера
          </Button>
        </div>
      )}
      {!loading && slots.length > 0 && (
        <Card>
          <SlotPicker
            slots={slots.map(toSlot)}
            value={selectedSlotId(slots, selectedSlot)}
            onChange={(id) => {
              const slot = slots[Number(id?.split('-')[1] ?? '-1')];
              if (slot) onSelect(slot);
            }}
          />
        </Card>
      )}
      <Button disabled={!selectedSlot} onClick={onNext}>
        Далі
      </Button>
    </div>
  );
}