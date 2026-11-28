// T-4619c: кабінет відновлює оплату лише коли серверне утримання ще активне.
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DepositPaymentAction } from '../DepositPaymentAction';
import { getDepositStatus, payDeposit } from '@/app/booking/bookingApi';

jest.mock('@/app/booking/bookingApi', () => ({
  getDepositStatus: jest.fn(),
  payDeposit: jest.fn(),
}));

describe('DepositPaymentAction', () => {
  beforeEach(() => {
    jest.mocked(getDepositStatus).mockReset();
    jest.mocked(payDeposit).mockReset();
  });

  it('показує кнопку для активного утримання і списує депозит', async () => {
    jest.mocked(getDepositStatus).mockResolvedValue({
      status: 'payable',
      amount: 210,
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      serverNow: new Date().toISOString(),
    });
    jest.mocked(payDeposit).mockResolvedValue({
      bookingId: 'b-1',
      outcome: 'failed',
      paymentId: null,
      depositAmount: 210,
      requiresBalance: false,
      receiptId: null,
      failureReason: 'declined',
    });

    render(<DepositPaymentAction bookingId="b-1" />);

    const button = await screen.findByRole('button', { name: /Сплатити депозит/ });
    fireEvent.click(button);

    expect(payDeposit).toHaveBeenCalledWith('b-1');
    expect(await screen.findByText(/Кошти не списані/)).toBeInTheDocument();
  });

  it('не пропонує оплату після завершення утримання', async () => {
    jest.mocked(getDepositStatus).mockResolvedValue({
      status: 'expired',
      serverNow: new Date().toISOString(),
    });

    render(<DepositPaymentAction bookingId="b-1" />);

    expect(await screen.findByText('Час на оплату депозиту минув')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
