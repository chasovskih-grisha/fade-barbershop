'use client';

// Тулбар фільтрів календаря (T-045, REF-ADM-02): день/тиждень, дата,
// локація, барбер, «з референсом / без» + кнопка оновлення.
import { Button } from '@fade/ui';
import { FilterSelect } from '../components/FilterSelect';
import { STATUS_FILTER_OPTIONS } from './visit-status';

export type View = 'day' | 'week';
export type ReferenceFilter = 'all' | 'with' | 'without';
type Location = { id: string; name: string };
type Barber = { id: string; name: string | null };

export interface ToolbarState {
  view: View;
  date: string;
  locationId: string;
  barberId: string;
  reference: ReferenceFilter;
  /** Статус візита ('' = усі) — фільтрує сервер (GET /admin/calendar?status=). */
  status: string;
}

export default function CalendarToolbar(props: {
  state: ToolbarState;
  locations: Location[];
  barbers: Barber[];
  onChange: (patch: Partial<ToolbarState>) => void;
  onRefresh: () => void;
}) {
  const { state, locations, barbers, onChange, onRefresh } = props;
  const select = 'mt-1 block rounded-input border border-line p-2';
  return (
    // prettier-ignore
    <form className="flex flex-wrap items-end gap-3" aria-label="Фільтри календаря" onSubmit={(event) => event.preventDefault()}>
      <label>
        Вигляд
        {/* prettier-ignore */}
        <select value={state.view} onChange={(event) => onChange({ view: event.target.value as View })} className={select}>
          <option value="day">День</option>
          <option value="week">Тиждень</option>
        </select>
      </label>
      <label>
        Дата
        {/* prettier-ignore */}
        <input type="date" value={state.date} onChange={(event) => onChange({ date: event.target.value })} className={select} />
      </label>
      <label>
        Локація
        {/* prettier-ignore */}
        <select value={state.locationId} onChange={(event) => onChange({ locationId: event.target.value })} className={select}>
          <option value="">Усі</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Барбер
        {/* prettier-ignore */}
        <select value={state.barberId} onChange={(event) => onChange({ barberId: event.target.value })} className={select}>
          <option value="">Усі</option>
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.name ?? barber.id}
            </option>
          ))}
        </select>
      </label>
      <label>
        Референс
        <select
          value={state.reference}
          onChange={(event) => onChange({ reference: event.target.value as ReferenceFilter })}
          className={select}
        >
          <option value="all">Усі</option>
          <option value="with">З референсом</option>
          <option value="without">Без референсу</option>
        </select>
      </label>
      <FilterSelect
        label="Статус"
        value={state.status}
        options={STATUS_FILTER_OPTIONS}
        onChange={(status) => onChange({ status })}
      />
      <Button variant="secondary" size="md" onClick={onRefresh}>
        Оновити
      </Button>
    </form>
  );
}
