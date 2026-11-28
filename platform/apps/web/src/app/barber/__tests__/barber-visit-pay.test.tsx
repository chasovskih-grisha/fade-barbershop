'use client';

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BarberPage from '../page';
import * as auth from '@/app/components/auth/AuthProvider';
import * as barberOnsite from '@/lib/api/barber-onsite';

jest.mock('@/lib/api/barber-onsite', () => ({
  getBarberOnsiteStatus: jest.fn(),
  payBarberOnsite: jest.fn(),
}));

jest.mock('@/app/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// PAY-ONS-01: барбер позначає оплату лише walk-in візиту після послуги.
function visit(over: Record<string, unknown> = {}) {
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

function stubVisits(visits: ReturnType<typeof visit>[]) {
  (global.fetch as jest.Mock | undefined) = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ visits }),
  } as unknown as Response);
}

beforeEach(() => {
  jest.clearAllMocks();
  stubVisits([visit()]);
});

function stubAuth(user: { id: string; name: string; role: string } | null) {
  return jest.spyOn(auth, 'useAuth').mockReturnValue({
    user,
    isLoading: false,
  } as ReturnType<typeof auth.useAuth>);
}

const STATUS_UNPAID = { bookingId: 'v1', amountDue: 420, paymentStatus: 'unpaid' };
function flushMicrotasks() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('сторінка барбера — список візитів і оплата на місці', () => {
  const barber = { id: 'barber-1', name: 'Олександр', role: 'barber' };

  it('показує власні візити після завантаження', async () => {
    stubAuth(barber);
    render(<BarberPage />);
    await flushMicrotasks();

    await waitFor(() => screen.getByRole('button', { name: 'Оплатити на місці' }), {
      timeout: 2000,
    });
    expect(screen.getByRole('button', { name: 'Оплатити на місці' })).toBeInTheDocument();
  });

  it('відкриває діалог і показує статус оплати', async () => {
    stubAuth(barber);
    jest.spyOn(barberOnsite, 'getBarberOnsiteStatus').mockResolvedValue(STATUS_UNPAID);
    render(<BarberPage />);

    await waitFor(() => screen.getByRole('button', { name: 'Оплатити на місці' }));
    await userEvent.click(screen.getByRole('button', { name: 'Оплатити на місці' }));
    await flushMicrotasks();

    await waitFor(() => screen.getByText('Оплата на місці'));
    expect(screen.getByText('Сума до сплати')).toBeInTheDocument();
    expect(screen.getByText(/420/)).toBeInTheDocument();
    // Вузька поверхня барбера: депозит і фінальна ціна лишаються в адмінці.
    expect(screen.queryByText('Депозит')).toBeNull();
    expect(screen.queryByText('Фінальна ціна')).toBeNull();
  });

  it('після успішної оплати діалог закривається і список перезавантажується', async () => {
    stubAuth(barber);
    jest.spyOn(barberOnsite, 'getBarberOnsiteStatus').mockResolvedValue(STATUS_UNPAID);
    jest.spyOn(barberOnsite, 'payBarberOnsite').mockResolvedValue({
      bookingId: 'v1',
      outcome: 'captured',
      paidAmount: 420,
      failureReason: null,
    });

    render(<BarberPage />);
    await waitFor(() => screen.getByRole('button', { name: 'Оплатити на місці' }));
    await userEvent.click(screen.getByRole('button', { name: 'Оплатити на місці' }));
    await flushMicrotasks();

    await waitFor(() => screen.getByText('Оплата на місці'));

    await userEvent.click(screen.getByRole('button', { name: 'Готівка' }));
    await userEvent.click(screen.getByRole('button', { name: 'Позначити оплату' }));
    await flushMicrotasks();

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(barberOnsite.payBarberOnsite).toHaveBeenCalledWith('v1', 'cash');
  });

  it('помилка завантаження статусу показується в діалозі', async () => {
    stubAuth(barber);
    jest
      .spyOn(barberOnsite, 'getBarberOnsiteStatus')
      .mockRejectedValueOnce(new Error('Запит не вдався'));
    render(<BarberPage />);

    await waitFor(() => screen.getByRole('button', { name: 'Оплатити на місці' }));
    await userEvent.click(screen.getByRole('button', { name: 'Оплатити на місці' }));
    await flushMicrotasks();
    await waitFor(() => screen.getByText('Запит не вдався'));
  });

  it('помилка оплати показується в діалозі, список не змінюється', async () => {
    stubAuth(barber);
    jest.spyOn(barberOnsite, 'getBarberOnsiteStatus').mockResolvedValue(STATUS_UNPAID);
    jest
      .spyOn(barberOnsite, 'payBarberOnsite')
      .mockRejectedValueOnce(new Error('Сервер не відповів'));

    render(<BarberPage />);
    await waitFor(() => screen.getByRole('button', { name: 'Оплатити на місці' }));
    await userEvent.click(screen.getByRole('button', { name: 'Оплатити на місці' }));
    await flushMicrotasks();

    await waitFor(() => screen.getByText('Оплата на місці'));

    await userEvent.click(screen.getByRole('button', { name: 'Готівка' }));
    await userEvent.click(screen.getByRole('button', { name: 'Позначити оплату' }));
    await flushMicrotasks();

    await waitFor(() => screen.getByText('Сервер не відповів'));
    expect(barberOnsite.payBarberOnsite).toHaveBeenCalledWith('v1', 'cash');
    expect(screen.getByRole('button', { name: 'Оплатити на місці' })).toBeInTheDocument();
  });

  it('неавторизований користувач не бачить сторінку барбера', () => {
    stubAuth(null);
    render(<BarberPage />);
    expect(screen.queryByRole('heading', { name: 'Мої візити' })).toBeNull();
  });

  it('не пропонує оплату на завершеному онлайн-візиті — її позначає адміністратор', async () => {
    stubAuth(barber);
    stubVisits([visit({ source: 'client_web', status: 'completed' })]);
    render(<BarberPage />);

    await waitFor(() => screen.getByText(/Стрижка/));
    expect(screen.queryByRole('button', { name: 'Оплатити на місці' })).toBeNull();
    expect(screen.getByText(/позначає адміністратор/)).toBeInTheDocument();
  });

  it('не пропонує оплату на walk-in до завершення послуги', async () => {
    stubAuth(barber);
    stubVisits([visit({ source: 'walk_in', status: 'confirmed' })]);
    render(<BarberPage />);

    await waitFor(() => screen.getByText(/Стрижка/));
    expect(screen.queryByRole('button', { name: 'Оплатити на місці' })).toBeNull();
  });
});
