import type { ExtendedAppointment } from '@/lib/api/appointments';
import type { DepositTerms } from '@/lib/api/appointment-types';

const base: ExtendedAppointment = {
  id: 'v1',
  date: '2026-12-04',
  startTime: '14:00',
  endTime: '15:00',
  serviceName: 'Стрижка',
  barberName: 'Олександр',
  locationName: 'Центр',
  price: 600,
  status: 'confirmed',
  referenceId: null,
  referenceComment: '',
  canEditReference: true,
  canBookAgain: true,
  deposit: null,
};

export function makeVisit(over: Partial<ExtendedAppointment> = {}): ExtendedAppointment {
  const merged = { ...base, ...over };
  const deposit: DepositTerms | null = merged.deposit ?? null;
  return { ...merged, deposit };
}
