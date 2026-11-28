import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShareBarberButton } from '@/app/components/ShareBarberButton';

const barber = { id: 'barber-1', name: 'Тарас Шевченко', slug: 'taras-shevchenko' };

const expectedUrl = () => new URL('/barbers/taras-shevchenko', window.location.origin).toString();

async function clickShare() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Поділитися' }));
  });
}

function mockClipboard(writeText: jest.Mock) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

describe('ShareBarberButton (T-4862a)', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('копіює абсолютну адресу профілю майстра', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<ShareBarberButton barber={barber} />);

    await clickShare();

    expect(writeText).toHaveBeenCalledWith(expectedUrl());
  });

  it('підтверджує копіювання текстом', async () => {
    mockClipboard(jest.fn().mockResolvedValue(undefined));
    render(<ShareBarberButton barber={barber} />);

    await clickShare();

    expect(await screen.findByRole('status')).toHaveTextContent('Посилання скопійовано');
  });

  it('каже про невдачу, коли буфер обміну відмовив', async () => {
    mockClipboard(jest.fn().mockRejectedValue(new Error('denied')));
    render(<ShareBarberButton barber={barber} />);

    await clickShare();

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Не вдалося скопіювати');
    expect(status).not.toHaveTextContent('скопійовано');
  });

  it('використовує системне вікно поширення, коли воно є', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    const writeText = jest.fn();
    mockClipboard(writeText);
    render(<ShareBarberButton barber={barber} />);

    await clickShare();

    expect(share).toHaveBeenCalledWith({ title: 'Тарас Шевченко', url: expectedUrl() });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('мовчить, коли гість закрив системне вікно поширення', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    Object.defineProperty(navigator, 'share', {
      value: jest.fn().mockRejectedValue(abort),
      configurable: true,
    });
    render(<ShareBarberButton barber={barber} />);

    await clickShare();

    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
