'use client';

// Перемикач режиму матриці (T-4521b): усі послуги / лише обрані / за категоріями.
// Винесено з BarberServiceMatrixEditor за LOC-гейтом.
export type MatrixMode = 'all' | 'selected' | 'category';

const MODES: Array<[MatrixMode, string]> = [
  ['all', 'Усі послуги'],
  ['selected', 'Лише обрані'],
  ['category', 'За категоріями'],
];

export function MatrixModePicker({
  barberId,
  mode,
  onPick,
}: {
  barberId: string;
  mode: MatrixMode;
  onPick: (next: MatrixMode) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Режим матриці" className="flex flex-wrap gap-3 text-body">
      {MODES.map(([value, label]) => (
        <label key={value} className="flex items-center gap-1">
          <input
            type="radio"
            name={`matrix-mode-${barberId}`}
            value={value}
            checked={mode === value}
            onChange={() => onPick(value)}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
