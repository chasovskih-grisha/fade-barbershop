'use client';

// Крісла локації (§1.4, T-4525a): read-only список № · назва · активність.
// Керування кріслами — форма локації (MNG-ADM-04); тут лише огляд стану.
import { Badge } from '@fade/ui';

export interface ChairItem {
  number: number;
  name: string | null;
  active: boolean;
}

export default function ChairsSection({ chairs = [] }: { chairs?: ChairItem[] | undefined }) {
  const activeCount = chairs.filter((chair) => chair.active).length;

  return (
    <section
      aria-label="Крісла локації"
      className="flex flex-col gap-3 rounded-card border border-line p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-h4">Крісла</h2>
        <span className="text-body text-fg-secondary">
          Активні: {activeCount}/{chairs.length}
        </span>
      </div>

      {chairs.length === 0 ? (
        <p className="text-body text-fg-muted">Крісел ще немає.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {chairs.map((chair) => (
            <li key={chair.number} className="flex items-center justify-between gap-3">
              <span className="text-body">
                №{chair.number}
                {chair.name ? ` · ${chair.name}` : ''}
              </span>
              <Badge tone={chair.active ? 'success' : 'neutral'}>
                {chair.active ? 'Активне' : 'Неактивне'}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
