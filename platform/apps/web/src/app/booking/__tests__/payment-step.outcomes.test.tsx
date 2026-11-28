// T-4619b: явна відмова і невідомий результат оплати не мають виглядати як
// успішне списання або як безповоротна відмова.
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentStep from '../steps/PaymentStep';
import { fetchDepositStatus, payDeposit } from '../bookingApi';

jest.mock('../bookingApi', () => ({
  fetchDepositStatus: jest.fn(),
  payDeposit: jest.fn(),
}));

const expiresAt = () => new Date(Date.now() + 125_000).toISOString();

function renderStep(serverNow = new Date().toISOString()) {
  render(
    <PaymentStep
      bookingId="apt-1"
      amount={180}
      expiresAt={expiresAt()}
      serverNow={serverNow}
      onCaptured={jest.fn()}
    />
  );
}

beforeEach(() => {
  jest.mocked(payDeposit).mockReset();
  jest.mocked(fetchDepositStatus).mockReset();
});

describe('PaymentStep outcomes (T-4619b)', () => {
  it('рахує дедлайн за серверним годинником, а не за годинником клієнта', () => {
    const serverNow = new Date(Date.now() + 2 * 3_600_000).toISOString();
    renderStep(serverNow);

    expect(screen.getByText(/Час на оплату минув/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Сплатити депозит/ })).toBeNull();
  });

  it('явна відмова не видає себе за списання і не показує чек', async () => {
    jest.mocked(payDeposit).mockResolvedValue({
      bookingId: 'apt-1',
      outcome: 'failed',
      paymentId: null,
      depositAmount: 180,
      requiresBalance: false,
      receiptId: null,
      failureReason: 'card_declined',
    });
    renderStep();

    fireEvent.click(screen.getByRole('button', { name: 'Сплатити депозит 180 ₴' }));

    expect(await screen.findByText(/Кошти не списані/)).toBeInTheDocument();
    expect(screen.queryByTestId('deposit-countdown')).toBeNull();
    expect(screen.getByRole('link', { name: 'Записатися знову' })).toHaveAttribute(
      'href',
      '/booking'
    );
  });

  it('мережева помилка не стверджує ні списання, ні відмову', async () => {
    jest.mocked(payDeposit).mockRejectedValue(new Error('network down'));
    jest.mocked(fetchDepositStatus).mockResolvedValue({
      bookingId: 'apt-1',
      outcome: 'pending',
      paymentId: 'pay-1',
      depositAmount: 180,
      requiresBalance: false,
      receiptId: null,
      failureReason: null,
    });
    renderStep();

    fireEvent.click(screen.getByRole('button', { name: 'Сплатити депозит 180 ₴' }));

    expect(await screen.findByText(/не отримали відповідь про списання/i)).toBeInTheDocument();
    expect(screen.queryByText(/Кошти не списані/)).toBeNull();
    expect(payDeposit).toHaveBeenCalledTimes(1);
    expect(fetchDepositStatus).toHaveBeenCalledWith('apt-1');
    expect(screen.getByRole('button', { name: 'Перевірити статус' })).toBeInTheDocument();
  });
});
