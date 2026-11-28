// T-4619b: після втраченої відповіді клієнт звіряє статус замість повторного
// POST; кнопка перевірки статусу нічого не списує.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentStep from '../steps/PaymentStep';
import { fetchDepositStatus, payDeposit } from '../bookingApi';
import type { DepositPayment } from '../bookingApi';

jest.mock('../bookingApi', () => ({
  fetchDepositStatus: jest.fn(),
  payDeposit: jest.fn(),
}));

const expiresAt = () => new Date(Date.now() + 125_000).toISOString();

const PENDING: DepositPayment = {
  bookingId: 'apt-1',
  outcome: 'pending',
  paymentId: 'pay-1',
  depositAmount: 180,
  requiresBalance: false,
  receiptId: null,
  failureReason: null,
};

beforeEach(() => {
  jest.mocked(payDeposit).mockReset();
  jest.mocked(fetchDepositStatus).mockReset();
});

describe('PaymentStep recovery (T-4619b)', () => {
  it('після втраченої відповіді звіряє статус і не повторює POST', async () => {
    jest.mocked(payDeposit).mockRejectedValue(new Error('network down'));
    jest.mocked(fetchDepositStatus).mockResolvedValue({
      ...PENDING,
      outcome: 'already_paid',
      receiptId: 'check-1',
    });
    const onCaptured = jest.fn();
    render(
      <PaymentStep bookingId="apt-1" amount={180} expiresAt={expiresAt()} onCaptured={onCaptured} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Сплатити депозит 180 ₴' }));

    await waitFor(() => expect(onCaptured).toHaveBeenCalledTimes(1));
    expect(payDeposit).toHaveBeenCalledTimes(1);
    expect(fetchDepositStatus).toHaveBeenCalledWith('apt-1');
  });

  it('кнопка перевірки статусу робить лише читання', async () => {
    jest.mocked(payDeposit).mockRejectedValue(new Error('network down'));
    jest.mocked(fetchDepositStatus).mockResolvedValue(PENDING);
    render(
      <PaymentStep bookingId="apt-1" amount={180} expiresAt={expiresAt()} onCaptured={jest.fn()} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Сплатити депозит 180 ₴' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Перевірити статус' }));

    await waitFor(() => expect(fetchDepositStatus).toHaveBeenCalledTimes(2));
    expect(payDeposit).toHaveBeenCalledTimes(1);
  });
});
