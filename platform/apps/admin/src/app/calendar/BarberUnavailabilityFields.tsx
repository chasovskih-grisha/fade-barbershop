'use client';

// Поля позначки недоступності (T-4616b) — презентаційні: стан і запит тримає
// форма. Винесено окремо, щоб форма лишалась читабельною (ліміт 100 рядків).
export interface UnavailabilityOption {
  id: string;
  name: string | null;
}

export interface UnavailabilityDraft {
  barberId: string;
  locationId: string;
  start: string;
  end: string;
  reason: string;
}

const FIELD = 'flex flex-col gap-1';
const CONTROL = 'rounded border border-border px-2 py-1';

export function UnavailabilityFields({
  value,
  barbers,
  locations,
  onChange,
}: {
  value: UnavailabilityDraft;
  barbers: UnavailabilityOption[];
  locations: UnavailabilityOption[];
  onChange: (patch: Partial<UnavailabilityDraft>) => void;
}) {
  return (
    <>
      <label className={FIELD}>
        Барбер
        <select
          aria-label="Барбер"
          className={CONTROL}
          value={value.barberId}
          onChange={(event) => onChange({ barberId: event.target.value })}
        >
          <option value="">Оберіть</option>
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.name ?? barber.id}
            </option>
          ))}
        </select>
      </label>
      <label className={FIELD}>
        Локація
        <select
          aria-label="Локація"
          className={CONTROL}
          value={value.locationId}
          onChange={(event) => onChange({ locationId: event.target.value })}
        >
          <option value="">Уся мережа</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name ?? location.id}
            </option>
          ))}
        </select>
      </label>
      <label className={FIELD}>
        Від
        <input
          aria-label="Початок недоступності"
          type="datetime-local"
          className={CONTROL}
          value={value.start}
          onChange={(event) => onChange({ start: event.target.value })}
        />
      </label>
      <label className={FIELD}>
        До
        <input
          aria-label="Кінець недоступності"
          type="datetime-local"
          className={CONTROL}
          value={value.end}
          onChange={(event) => onChange({ end: event.target.value })}
        />
      </label>
      <label className={FIELD}>
        Причина
        <input
          aria-label="Причина"
          className={`w-40 ${CONTROL}`}
          value={value.reason}
          onChange={(event) => onChange({ reason: event.target.value })}
        />
      </label>
    </>
  );
}
