import { cn } from './cn';

export type SlotState = 'free' | 'busy' | 'hold';

export interface Slot {
  id: string;
  time: string;
  state: SlotState;
  staff?: string | undefined;
}

export interface SlotPickerProps {
  slots: Slot[];
  onChange: (id: string) => void;
  value?: string | null | undefined;
  anyStaff?: { selected: boolean; onToggle: () => void } | undefined;
  className?: string | undefined;
}

const CHIP =
  'h-11 rounded-input border px-2 text-body tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base';

const STATES: Record<SlotState, string> = {
  free: 'border-line bg-surface-sunken text-fg hover:border-line-strong hover:bg-interactive',
  busy: 'cursor-not-allowed border-line bg-surface-base text-fg-muted line-through',
  hold: 'cursor-not-allowed border-semantic-warning/40 bg-semantic-warning/10 text-semantic-warning',
};

/** Обраний час — кістяна плитка, як обраний день. Класи не змішуються з free: cn не зливає утиліти. */
const SELECTED =
  'border-accent bg-accent font-medium text-accent-fg hover:bg-fg-secondary active:bg-fg-muted';

export function SlotPicker({ slots, onChange, value, anyStaff, className }: SlotPickerProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {anyStaff ? (
        <button
          type="button"
          aria-pressed={anyStaff.selected}
          onClick={anyStaff.onToggle}
          className={cn(
            'self-start rounded-pill border px-3 py-1 text-caption font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
            anyStaff.selected
              ? 'border-accent-blue/40 text-accent-blue'
              : 'border-line text-fg-secondary hover:text-fg'
          )}
        >
          Будь-який барбер
        </button>
      ) : null}
      <div aria-label="Доступні слоти" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const selected = slot.state === 'free' && slot.id === value;
          return (
            <button
              key={slot.id}
              type="button"
              disabled={slot.state !== 'free'}
              aria-pressed={selected}
              aria-label={slot.staff ? `${slot.time}, ${slot.staff}` : slot.time}
              onClick={() => onChange(slot.id)}
              className={cn(CHIP, selected ? SELECTED : STATES[slot.state])}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
