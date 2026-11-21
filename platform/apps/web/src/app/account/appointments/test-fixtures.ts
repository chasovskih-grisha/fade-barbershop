import type { CabinetStatus, ExtendedAppointment } from '@/lib/api/appointments';

/**
 * Фабрика візиту для тестів кабінету. Один вхід — щоб тест міняв лише те,
 * що перевіряє (статус, референс), а не мовчки тримав застарілі
 * поля контракту: після їхнього видалення TypeScript сам нагадає про себе.
 */
export function makeVisit(
  overrides: Partial<ExtendedAppointment> & { id?: string; status?: CabinetStatus } = {}
): ExtendedAppointment {
  return {
    id: 'apt-1',
    date: '2026-10-02',
    startTime: '11:00',
    endTime: '11:45',
    serviceName: 'Стрижка',
    barberName: 'Олексій',
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
