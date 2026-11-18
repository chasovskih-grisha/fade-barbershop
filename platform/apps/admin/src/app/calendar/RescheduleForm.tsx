'use client';

// Форма перенесення візиту (T-4533): дата + HH:mm — валідує той самий
// SlotValidator, що й новий запис; 409 → конфлікт слота.
import { Button } from '@fade/ui';

export default function RescheduleForm(props: {
  busy: boolean;
  onSubmit: (value: { date: string; start: string; end: string }) => void;
}) {
  const { busy, onSubmit } = props;
  const input = 'mt-1 block rounded-input border border-line p-2';
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-3"
      aria-label="Перенести запис"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit({
          date: String(data.get('date') ?? ''),
          start: String(data.get('start') ?? ''),
          end: String(data.get('end') ?? ''),
        });
      }}
    >
      <label>
        Дата
        <input name="date" required type="date" className={input} />
      </label>
      <label>
        Початок
        <input name="start" required type="time" step={900} className={input} />
      </label>
      <label>
        Кінець
        <input name="end" required type="time" step={900} className={input} />
      </label>
      <Button type="submit" variant="secondary" size="md" disabled={busy}>
        Перенести
      </Button>
    </form>
  );
}
