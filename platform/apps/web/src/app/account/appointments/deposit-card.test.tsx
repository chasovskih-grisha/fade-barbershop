// T-4737: картка візиту називає суму депозиту й дедлайн скасування сама,
// а не лише всередині діалогу скасування. Дані — снепшот візиту.
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppointmentCard } from './AppointmentCard';
import { formatCancelDeadline } from './deposit-summary';
import { makeVisit } from './test-fixtures';
import type { ExtendedAppointment } from '@/lib/api/appointments';

const NOW = new Date('2026-10-02T08:00:00.000Z');

function renderCard(deposit?: NonNullable<ExtendedAppointment['deposit']>) {
  return render(
    <AppointmentCard
      app={makeVisit(deposit ? { deposit } : {})}
      processingAction={null}
      onReschedule={jest.fn()}
      onCancel={jest.fn()}
      onEditReference={jest.fn()}
    />
  );
}

describe('рядок депозиту в картці візиту', () => {
  beforeEach(() => jest.useFakeTimers({ now: NOW }));
  afterEach(() => jest.useRealTimers());

  it('показує суму і дедлайн у часі Києва', () => {
    renderCard({ amount: 210, freeCancelUntil: '2026-10-02T09:00:00.000Z' });
    expect(screen.getAllByText('Депозит')).toHaveLength(1);
    expect(screen.getByText(/210/)).toBeInTheDocument();
    expect(screen.getByText(/Безкоштовне скасування до 2/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Оплатити депозит' })).toBeNull();
  });

  it('після дедлайну каже, що вікно минуло', () => {
    renderCard({ amount: 210, freeCancelUntil: '2026-10-02T07:00:00.000Z' });
    expect(screen.getByText('Депозит')).toBeInTheDocument();
    expect(screen.getByText(/210/)).toBeInTheDocument();
    expect(screen.getByText('Вікно безкоштовного скасування минуло')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Оплатити депозит' })).toBeNull();
  });

  it('сума без дедлайну — лише сума, без вигаданої дати', () => {
    renderCard({ amount: 210, freeCancelUntil: null });
    expect(screen.getByText('Депозит')).toBeInTheDocument();
    expect(screen.getByText(/210/)).toBeInTheDocument();
    expect(screen.queryByText(/Безкоштовне скасування/)).toBeNull();
    expect(screen.queryByRole('link', { name: 'Оплатити депозит' })).toBeNull();
  });

  it('без депозиту або з нулем про гроші мовчить', () => {
    renderCard();
    expect(screen.queryByText('Депозит')).toBeNull();
    renderCard({ amount: 0, freeCancelUntil: '2026-10-02T09:00:00.000Z' });
    expect(screen.queryByText('Депозит')).toBeNull();
  });

  it('дає продовжити оплату і показує серверний дедлайн утримання', () => {
    renderCard({
      amount: 210,
      freeCancelUntil: null,
      bookingId: 'bk-1',
      expiresAt: '2030-01-01T09:00:00.000Z',
      holdStatus: 'active',
    });
    expect(screen.getByText('Депозит')).toBeInTheDocument();
    expect(screen.getByText(/210/)).toBeInTheDocument();
    const depositRow = screen.getByText('Депозит').closest('.border-t');
    expect(depositRow?.textContent).toContain('Оплатіть депозит до 1 січня');
    expect(screen.getByRole('link', { name: 'Оплатити депозит' })).toHaveAttribute(
      'href',
      '/booking/deposit/bk-1'
    );
  });

  it('після прострочення утримання каже про звільнене крісло без оплати', () => {
    renderCard({
      amount: 210,
      freeCancelUntil: null,
      bookingId: 'bk-1',
      expiresAt: '2026-10-02T07:00:00.000Z',
      holdStatus: 'expired',
    });
    expect(screen.getByText('Депозит')).toBeInTheDocument();
    expect(screen.getByText(/210/)).toBeInTheDocument();
    expect(screen.getByText('Час на оплату минув — крісло звільнено')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Оплатити депозит' })).toBeNull();
  });
});

describe('deposit-summary', () => {
  it('форматує дедлайн і мовчить про зіпсований ISO', () => {
    expect(formatCancelDeadline('2026-10-02T09:00:00.000Z')).toBe('2 жовтня о 12:00');
    expect(formatCancelDeadline(null)).toBeNull();
    expect(formatCancelDeadline('не дата')).toBeNull();
  });
});
