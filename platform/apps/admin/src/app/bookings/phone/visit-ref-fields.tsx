'use client';

// Селекти довідників форми візиту (T-4409/T-4738b): локація → послуга →
// барбер → дата. Послуга — каталог обраної локації і заблокована, доки
// локацію не обрано.
import { SelectField } from './select-field';
import type { ServiceOption } from './useLocationServices';
import type { BarberOption, LocationOption, RefsState } from './useVisitRefs';

export interface RefFieldsProps {
  locations: LocationOption[];
  services: ServiceOption[];
  barbers: BarberOption[];
  dates: { value: string; label: string }[];
  refsState: RefsState;
  locationId: string;
  serviceId: string;
  barberId: string;
  date: string;
  onLocation: (id: string) => void;
  onService: (id: string) => void;
  onBarber: (id: string) => void;
  onDate: (value: string) => void;
}

export function VisitRefFields(props: RefFieldsProps) {
  const { locations, services, barbers, dates, refsState } = props;
  return (
    <>
      <SelectField
        id="locationId"
        label="Локація"
        empty="Оберіть локацію"
        refsState={refsState}
        value={props.locationId}
        onChange={(event) => props.onLocation(event.target.value)}
      >
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="serviceId"
        label="Послуга"
        empty={props.locationId ? 'Оберіть послугу' : 'Спершу оберіть локацію'}
        refsState={refsState}
        value={props.serviceId}
        disabled={!props.locationId}
        onChange={(event) => props.onService(event.target.value)}
      >
        {services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="barberId"
        label="Барбер"
        empty="Оберіть барбера"
        refsState={refsState}
        value={props.barberId}
        onChange={(event) => props.onBarber(event.target.value)}
      >
        {barbers.map((barber) => (
          <option key={barber.id} value={barber.id}>
            {barber.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        id="date"
        label="Дата"
        empty="Оберіть дату"
        refsState={refsState}
        value={props.date}
        onChange={(event) => props.onDate(event.target.value)}
      >
        {dates.map((day) => (
          <option key={day.value} value={day.value}>
            {day.label}
          </option>
        ))}
      </SelectField>
    </>
  );
}
