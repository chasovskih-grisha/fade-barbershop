'use client';

// Спільний select-фільтр для таблиць адмінки: «Статус», «Результат» тощо.
// Один label+select — той самий вигляд, що в CalendarToolbar.
const SELECT = 'mt-1 block rounded-input border border-line p-2';

export interface FilterOption {
  value: string;
  label: string;
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={SELECT}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
