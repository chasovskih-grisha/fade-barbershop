// Спільні фабрики для spec-файлів сторінки барбера (PAY-ONS-01).
import { act } from '@testing-library/react';
import * as auth from '@/app/components/auth/AuthProvider';

// PAY-ONS-01: барбер позначає оплату лише walk-in візиту після послуги.
export function visit(over: Record<string, unknown> = {}) {
  return {
    id: 'v1',
    date: '2026-10-02',
    startTime: '10:00',
    endTime: '11:00',
    serviceName: 'Стрижка',
    barberName: 'Олександр',
    locationName: 'Центр',
    price: 600,
    status: 'completed',
    source: 'walk_in',
    referenceId: null,
    referenceComment: '',
    canEditReference: false,
    canBookAgain: true,
    deposit: { amount: 180, freeCancelUntil: '2026-10-02T06:00:00.000Z' },
    ...over,
  };
}

export function stubVisits(visits: ReturnType<typeof visit>[]) {
  (global.fetch as jest.Mock | undefined) = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ visits }),
  } as unknown as Response);
}

export function stubAuth(user: { id: string; name: string; role: string } | null): jest.SpyInstance {
  return jest.spyOn(auth, 'useAuth').mockReturnValue({
    user,
    isLoading: false,
  } as ReturnType<typeof auth.useAuth>);
}

export const STATUS_UNPAID = { bookingId: 'v1', amountDue: 420, paymentStatus: 'unpaid' };

export const BARBER = { id: 'barber-1', name: 'Олександр', role: 'barber' };

export function flushMicrotasks() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}
