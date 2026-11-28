import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LocationShare } from './LocationShare';

const expectedUrl = () => new URL('/locations/podil', window.location.origin).toString();

async function clickShare() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Поділитися' }));
  });
}

function mockClipboard(writeText: jest.Mock) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

describe('LocationShare (T-4840a)', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('копіює абсолютну адресу сторінки локації', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<LocationShare name="FADE Поділ" code="podil" />);

    await clickShare();

    expect(writeText).toHaveBeenCalledWith(expectedUrl());
  });

  it('підтверджує копіювання текстом', async () => {
    mockClipboard(jest.fn().mockResolvedValue(undefined));
    render(<LocationShare name="FADE Поділ" code="podil" />);

    await clickShare();

    expect(await screen.findByRole('status')).toHaveTextContent('Посилання скопійовано');
  });

  it('каже про невдачу, коли буфер обміну відмовив', async () => {
    mockClipboard(jest.fn().mockRejectedValue(new Error('denied')));
    render(<LocationShare name="FADE Поділ" code="podil" />);

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
    render(<LocationShare name="FADE Поділ" code="podil" />);

    await clickShare();

    expect(share).toHaveBeenCalledWith({ title: 'FADE Поділ', url: expectedUrl() });
    expect(writeText).not.toHaveBeenCalled();
  });
});
