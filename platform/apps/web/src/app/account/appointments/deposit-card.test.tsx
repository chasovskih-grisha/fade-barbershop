// T-4737: картка візиту називає суму депозиту й дедлайн скасування сама,
// а не лише всередині діалогу скасування. Дані — снепшот візиту.
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppointmentCard } from './AppointmentCard';
import { depositDeadlineNote, formatCancelDeadline } from './deposit-summary';
import { makeVisit } from './test-fixtures';

const NOW = new Date('2026-10-02T08:00:00.000Z');

function renderCard(deposit?: { amount: number; freeCancelUntil: string | null }) {
  render(
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
    const row = screen.getByText('Депозит').parentElement;
    expect(row?.textContent).toContain('210');
    expect(screen.getByText('Безкоштовне скасування до 2 жовтня о 12:00')).toBeInTheDocument();
  });

  it('після дедлайну каже, що вікно минуло', () => {
    renderCard({ amount: 210, freeCancelUntil: '2026-10-02T07:00:00.000Z' });
    expect(
      screen.getByText('Вікно безкоштовного скасування минуло — депозит утримається')
    ).toBeInTheDocument();
  });

  it('сума без дедлайну — лише сума, без вигаданої дати', () => {
    renderCard({ amount: 210, freeCancelUntil: null });
    expect(screen.getByText('Депозит')).toBeInTheDocument();
    expect(screen.queryByText(/Безкоштовне скасування/)).toBeNull();
  });

  it('без депозиту або з нулем про гроші мовчить', () => {
    renderCard();
    expect(screen.queryByText('Депозит')).toBeNull();
    renderCard({ amount: 0, freeCancelUntil: '2026-10-02T09:00:00.000Z' });
    expect(screen.queryByText('Депозит')).toBeNull();
  });
});

describe('deposit-summary', () => {
  it('форматує дедлайн і мовчить про зіпсований ISO', () => {
    expect(formatCancelDeadline('2026-10-02T09:00:00.000Z')).toBe('2 жовтня о 12:00');
    expect(formatCancelDeadline(null)).toBeNull();
    expect(formatCancelDeadline('не дата')).toBeNull();
    expect(depositDeadlineNote({ deposit: null }, NOW)).toBeNull();
  });
});
