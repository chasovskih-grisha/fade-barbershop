// T-4619b: крок оплати депозиту показує серверний дедлайн, після успішного
// списання зникає, після expiry не пропонує оплату і веде назад у запис.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentStep from '../steps/PaymentStep';
import { fetchDepositStatus, payDeposit } from '../bookingApi';

jest.mock('../bookingApi', () => ({
  fetchDepositStatus: jest.fn(),
  payDeposit: jest.fn(),
}));

const inTwoMinutes = () => new Date(Date.now() + 125_000).toISOString();

beforeEach(() => {
  jest.mocked(payDeposit).mockReset();
  jest.mocked(fetchDepositStatus).mockReset();
});

describe('PaymentStep (T-4619b)', () => {
  it('показує залишок утримання з серверного expiresAt', () => {
    render(
      <PaymentStep
        bookingId="apt-1"
        serverNow={new Date().toISOString()}
        amount={180}
        expiresAt={inTwoMinutes()}
        onCaptured={jest.fn()}
      />
    );

    expect(screen.getByTestId('deposit-countdown').textContent).toMatch(/^02:0[45]$/);
    expect(screen.getByRole('button', { name: 'Сплатити депозит 180 ₴' })).toBeInTheDocument();
  });

  it('успішне списання забирає таймер і передає підтверджений візит далі', async () => {
    jest.mocked(payDeposit).mockResolvedValue({
      bookingId: 'apt-1',
      outcome: 'captured',
      paymentId: 'pay-1',
      depositAmount: 180,
      requiresBalance: true,
      receiptId: 'check-1',
      failureReason: null,
    });
    const onCaptured = jest.fn();
    render(
      <PaymentStep
        bookingId="apt-1"
        serverNow={new Date().toISOString()}
        amount={180}
        expiresAt={inTwoMinutes()}
        onCaptured={onCaptured}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Сплатити депозит 180 ₴' }));

    await waitFor(() => expect(onCaptured).toHaveBeenCalledTimes(1));
    expect(payDeposit).toHaveBeenCalledWith(
      'apt-1',
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    );
  });

  it('після expiry ховає оплату і дає посилання на новий запис', () => {
    render(
      <PaymentStep
        bookingId="apt-1"
        serverNow={new Date().toISOString()}
        amount={180}
        expiresAt={new Date(Date.now() - 1000).toISOString()}
        onCaptured={jest.fn()}
      />
    );

    expect(screen.getByText(/Крісло звільнено, бо оплату не проведено/)).toBeInTheDocument();
    expect(screen.getByText(/Кошти не списані/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Сплатити депозит/ })).toBeNull();
    expect(screen.queryByTestId('deposit-countdown')).toBeNull();
    expect(screen.getByRole('link', { name: 'Записатися знову' })).toHaveAttribute(
      'href',
      '/booking'
    );
  });

  it('переводить таймер в expiry на екрані без нової спроби оплати', () => {
    jest.useFakeTimers();
    try {
      render(
        <PaymentStep
          bookingId="apt-1"
          serverNow={new Date().toISOString()}
          amount={180}
          expiresAt={new Date(Date.now() + 1500).toISOString()}
          onCaptured={jest.fn()}
        />
      );
      expect(screen.getByTestId('deposit-countdown')).toHaveTextContent('00:01');

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.queryByRole('button', { name: /Сплатити депозит/ })).toBeNull();
      expect(screen.getByRole('link', { name: 'Записатися знову' })).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});
