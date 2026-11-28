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

describe('сторінка барбера — помилки й межі поверхні оплати', () => {
  it('помилка завантаження статусу показується в діалозі', async () => {
    stubAuth(BARBER);
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
    stubAuth(BARBER);
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
    stubAuth(BARBER);
    stubVisits([visit({ source: 'client_web', status: 'completed' })]);
    render(<BarberPage />);

    await waitFor(() => screen.getByText(/Стрижка/));
    expect(screen.queryByRole('button', { name: 'Оплатити на місці' })).toBeNull();
    expect(screen.getByText(/позначає адміністратор/)).toBeInTheDocument();
  });

  it('не пропонує оплату на walk-in до завершення послуги', async () => {
    stubAuth(BARBER);
    stubVisits([visit({ source: 'walk_in', status: 'confirmed' })]);
    render(<BarberPage />);

    await waitFor(() => screen.getByText(/Стрижка/));
    expect(screen.queryByRole('button', { name: 'Оплатити на місці' })).toBeNull();
  });
});
