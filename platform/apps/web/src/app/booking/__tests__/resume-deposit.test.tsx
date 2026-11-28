import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResumeDeposit } from '../deposit/ResumeDeposit';
import { fetchDepositStatus, type DepositPayment } from '../bookingApi';

jest.mock('../bookingApi', () => ({
  ...jest.requireActual('../bookingApi'),
  fetchDepositStatus: jest.fn(),
}));

const statusMock = fetchDepositStatus as jest.MockedFunction<typeof fetchDepositStatus>;

function payment(over: Partial<DepositPayment> = {}): DepositPayment {
  return {
    bookingId: 'bk-1',
    outcome: 'pending',
    paymentId: 'pay-1',
    depositAmount: 150,
    requiresBalance: true,
    receiptId: null,
    failureReason: null,
    expiresAt: '2030-01-01T10:15:00.000Z',
    ...over,
  };
}

describe('ResumeDeposit (cabinet resume)', () => {
  afterEach(() => jest.clearAllMocks());

  it('re-reads the server hold deadline before offering payment', async () => {
    statusMock.mockResolvedValue(payment());
    render(<ResumeDeposit bookingId="bk-1" />);

    expect(await screen.findByRole('button', { name: /Сплатити депозит 150/ })).toBeInTheDocument();
    expect(screen.getByTestId('deposit-countdown')).toBeInTheDocument();
    expect(statusMock).toHaveBeenCalledWith('bk-1');
  });

  it('shows the released state instead of a stale pay button', async () => {
    statusMock.mockResolvedValue(
      payment({ outcome: 'expired', depositAmount: 0, failureReason: 'deposit_hold_expired' })
    );
    render(<ResumeDeposit bookingId="bk-1" />);

    expect(await screen.findByText('Час на оплату минув')).toBeInTheDocument();
    expect(screen.getByText(/Крісло звільнено/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Сплатити депозит/ })).toBeNull();
  });

  it('does not charge a deposit that is already paid', async () => {
    statusMock.mockResolvedValue(payment({ outcome: 'already_paid' }));
    render(<ResumeDeposit bookingId="bk-1" />);

    expect(await screen.findByText('Депозит уже сплачено')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Сплатити депозит/ })).toBeNull();
  });

  it('refuses to guess a deadline when the server omits it', async () => {
    statusMock.mockResolvedValue(payment({ expiresAt: null }));
    render(<ResumeDeposit bookingId="bk-1" />);

    expect(await screen.findByText('Не вдалося отримати дедлайн')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Сплатити депозит/ })).toBeNull();
  });
});
