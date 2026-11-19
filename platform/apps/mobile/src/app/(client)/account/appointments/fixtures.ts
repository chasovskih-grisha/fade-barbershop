import type { ExtendedAppointment } from '../../../../lib/booking-contract';

/**
 * Фабрика одного візиту для тестів кабінету. Один вхід — щоб тест міняв лише
 * те, що перевіряє (статус, референс), а не мовчки тримав застарілі поля.
 */
export function makeVisit(overrides: Partial<ExtendedAppointment> = {}): ExtendedAppointment {
  return {
    id: 'apt-1',
    date: '2030-05-12',
    startTime: '10:00',
    endTime: '10:45',
    serviceName: 'Стрижка',
    barberName: 'Олекса',
    locationName: 'Поділ',
    price: 600,
    status: 'upcoming',
    referenceId: null,
    referenceComment: '',
    canEditReference: true,
    canBookAgain: true,
    ...overrides,
  };
}

/** Стандартний набір із чотирма статусами — для тестів розкладки секцій. */
export function makeClientAppointments(
  overrides: Partial<ExtendedAppointment> = {}
): ExtendedAppointment[] {
  return [
    makeVisit({ ...overrides, id: 'apt-upcoming', status: 'upcoming' }),
    makeVisit({ ...overrides, id: 'apt-confirmed', status: 'confirmed', serviceName: 'Гоління' }),
    makeVisit({ ...overrides, id: 'apt-completed', status: 'completed', canEditReference: false }),
    makeVisit({ ...overrides, id: 'apt-cancelled', status: 'cancelled', canEditReference: false }),
  ];
}
