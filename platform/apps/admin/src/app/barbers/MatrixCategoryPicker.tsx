'use client';

import { Checkbox } from '@fade/ui';

// Вибір категорій у режимі «за категоріями» (T-4521b). Винесено з
// BarberServiceMatrixEditor за LOC-гейтом.
export function MatrixCategoryPicker({
  groups,
  categories,
  busy,
  onToggle,
}: {
  groups: Array<{ name: string; serviceIds: string[] }>;
  categories: string[];
  busy: boolean;
  onToggle: (name: string, makeIt: boolean) => void;
}) {
  if (groups.length === 0) return null;
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Категорії послуг">
      {groups.map((group) => (
        <Checkbox
          key={group.name}
          label={group.name}
          checked={categories.includes(group.name)}
          disabled={busy}
          onChange={(event) => onToggle(group.name, event.target.checked)}
        />
      ))}
    </div>
  );
}
