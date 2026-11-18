# SlotPicker

Вибір слота запису (екран 3 флоу). Три стани слота: вільний / зайнятий / hold (лист очікування).

## API

```ts
type SlotState = 'free' | 'busy' | 'hold';

interface Slot {
  id: string;
  time: string;         // "10:00"
  state: SlotState;
  staff?: string;       // для aria-label "10:00, Олег"
}

interface SlotPickerProps {
  slots: Slot[];
  onChange: (id: string) => void;
  value?: string | null;
  anyStaff?: { selected: boolean; onToggle: () => void };   // «Будь-який барбер»
  className?: string;
}
```

- `free` — вибір; `busy`/`hold` — `disabled` (зайнятий — muted + закреслений, hold — warning-тон).
- `value`/`aria-pressed` — обраний слот. `value` дорівнює `slot.id` (`slot-0`), не індексу.
- Обраний вільний слот — окремий стиль: кістяна заливка `bg-accent` і нічний текст `text-accent-fg`, як обраний день. Класи free на нього не вішаються.
- `anyStaff` — окремий тонгл «Будь-який барбер» (при режимі конкретного барбера).

## Стани слота

`free · free-selected · busy (disabled) · hold (disabled) · anyStaff on/off`.

## Приклад

```tsx
<SlotPicker
  slots={slots}
  value={slotId}
  onChange={setSlot}
  anyStaff={{ selected: anyStaff, onToggle: () => setAnyStaff(!anyStaff) }}
/>
```

## Do / Don't

- ✓ лише цей компонент для вибору часу слота (не стрічки з різних кнопок).
- ✓ busy/hold не «працюючими» — `disabled`, не error.
- ✗ не робити окремий список «зайнятих» слотів поза picker'ом.
- ✗ не показувати час `hold` як вільний після натискання — це окремий стан.