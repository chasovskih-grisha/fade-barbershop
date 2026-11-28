'use client';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BarberPage from '../page';
import * as barberOnsite from '@/lib/api/barber-onsite';
import {
  BARBER,
  STATUS_UNPAID,
  flushMicrotasks,
  stubAuth,
  stubVisits,
  visit,
} from '../barber-visit-pay.fixture';

jest.mock('@/lib/api/barber-onsite', () => ({
  getBarberOnsiteStatus: jest.fn(),
  payBarberOnsite: jest.fn(),
}));

jest.mock('@/app/components/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  stubVisits([visit()]);
});

describe('сторінка барбера — список візитів і оплата на місці', () => {
  it('показує власні візити після завантаження', async () => {
    stubAuth(BARBER);
    render(<BarberPage />);
    await flushMicrotasks();

    await waitFor(() => screen.getByRole('button', { name: 'Оплатити на місці' }), {
      timeout: 2000,
    });
    expect(screen.getByRole('button', { name: 'Оплатити на місці' })).toBeInTheDocument();
  });

  it('відкриває діалог і показує статус оплати', async () => {
    stubAuth(BARBER);
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
    stubAuth(BARBER);
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
});
