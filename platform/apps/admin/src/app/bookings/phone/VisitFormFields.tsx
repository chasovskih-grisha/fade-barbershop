'use client';

// Поля форми візиту (T-4409/T-4738): локація → послуга → барбер → дата → слот.
// Логіка винесена: слоти — use-visit-slots, послуги локації — useLocationServices,
// дати — date-options, селекти — visit-ref-fields, приховані поля — visit-hidden-fields.
// Обрана послуга живе у VisitForm — вона вмикає кнопку «Створити візит» (T-4738).
import { useMemo, useState } from 'react';
import { dateOptionsFrom } from './date-options';
import { SlotSection } from './slot-section';
import { useLocationServices } from './useLocationServices';
import { useVisitSlots } from './use-visit-slots';
import { VisitHiddenFields } from './visit-hidden-fields';
import { VisitRefFields } from './visit-ref-fields';
import type { BarberOption, LocationOption, RefsState } from './useVisitRefs';

interface VisitFormFieldsProps {
  locations: LocationOption[];
  barbers: BarberOption[];
  refsState: RefsState;
  serviceId: string;
  onServiceChange: (id: string) => void;
}

export function VisitFormFields({
  locations,
  barbers,
  refsState,
  serviceId,
  onServiceChange,
}: VisitFormFieldsProps) {
  const [locationId, setLocationId] = useState('');
  const [date, setDate] = useState('');
  const [barberId, setBarberId] = useState('');
  const dates = useMemo(() => dateOptionsFrom(refsState), [refsState]);
  const { services } = useLocationServices(locationId);
  const duration = services.find((service) => service.id === serviceId)?.duration ?? 0;
  const { slots, loading, error, picked, setPicked } = useVisitSlots({
    ready: refsState === 'ready',
    locationId,
    serviceId,
    duration,
    date,
    barberId,
  });

  // Зміна локації прибирає послугу, якої нова локація не має (T-4738b).
  const chooseLocation = (next: string): void => {
    setLocationId(next);
    onServiceChange('');
    setPicked(null);
  };

  return (
    <>
      <VisitRefFields
        locations={locations}
        services={services}
        barbers={barbers}
        dates={dates}
        refsState={refsState}
        locationId={locationId}
        serviceId={serviceId}
        barberId={barberId}
        date={date}
        onLocation={chooseLocation}
        onService={(next) => {
          onServiceChange(next);
          setPicked(null);
        }}
        onBarber={(next) => {
          setBarberId(next);
          setPicked(null);
        }}
        onDate={(next) => {
          setDate(next);
          setPicked(null);
        }}
      />

      <SlotSection
        slots={slots}
        loading={loading}
        error={error}
        date={date}
        barberId={barberId}
        picked={picked}
        onPick={setPicked}
      />

      <VisitHiddenFields
        serviceId={serviceId}
        serviceDuration={duration}
        date={date}
        barberId={barberId}
        picked={picked}
      />
    </>
  );
}
