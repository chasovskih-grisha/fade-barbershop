// T-4737: діалог скасування називає лише той наслідок депозиту, який знає
// візит. Снепшот вікна — поле візиту, не глобальні «4 години».
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { CancelVisitDialog } from './CancelVisitDialog';
import { cancelDepositOutcome } from './cancel-consequence';
import { makeVisit } from './test-fixtures';

const NOW = new Date('2026-10-02T08:00:00.000Z');
const RETURNED = 'Депозит повернеться';
const RETAINED = 'Депозит утримується';

function visitWithDeposit(freeCancelUntil: string | null, amount = 210): ExtendedAppointment {
  return makeVisit({ deposit: { amount, freeCancelUntil } });
}

describe('наслідок скасування береться з візиту', () => {
  it('без депозиту наслідку немає', () => {
    expect(cancelDepositOutcome(makeVisit(), NOW)).toBeNull();
    expect(cancelDepositOutcome(makeVisit({ deposit: null }), NOW)).toBeNull();
    expect(cancelDepositOutcome(visitWithDeposit('2026-10-02T09:00:00.000Z', 0), NOW)).toBeNull();
  });

  it('депозит і збережене вікно: у дедлайн або раніше — повертається', () => {
    expect(cancelDepositOutcome(visitWithDeposit(NOW.toISOString()), NOW)).toBe('returned');
    expect(cancelDepositOutcome(visitWithDeposit('2026-10-02T09:00:00.000Z'), NOW)).toBe(
      'returned'
    );
  });

  it('депозит і збережене вікно: пізніше дедлайну — утримується', () => {
    expect(cancelDepositOutcome(visitWithDeposit('2026-10-02T07:59:00.000Z'), NOW)).toBe(
      'retained'
    );
  });

  it('депозит без збереженого вікна не вигадує речення', () => {
    expect(cancelDepositOutcome(visitWithDeposit(null), NOW)).toBeNull();
  });
});

describe('діалог скасування', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    global.fetch = jest.fn() as unknown as typeof fetch;
  });
  afterEach(() => jest.useRealTimers());

  function renderDialog(visit: ExtendedAppointment) {
    const onConfirm = jest.fn();
    render(
      <CancelVisitDialog
        visit={visit}
        open
        busy={false}
        error={null}
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />
    );
    return onConfirm;
  }

  it('поза вікном каже, що депозит повернеться', () => {
    renderDialog(visitWithDeposit('2026-10-02T09:00:00.000Z'));
    expect(screen.getByText(RETURNED)).toBeInTheDocument();
    expect(screen.queryByText(RETAINED)).toBeNull();
  });

  it('усередині вікна каже, що депозит утримується', () => {
    renderDialog(visitWithDeposit('2026-10-02T07:00:00.000Z'));
    expect(screen.getByText(RETAINED)).toBeInTheDocument();
    expect(screen.queryByText(RETURNED)).toBeNull();
  });

  it('без депозиту або без вікна про гроші мовчить', () => {
    renderDialog(visitWithDeposit(null));
    expect(screen.queryByText(RETURNED)).toBeNull();
    expect(screen.queryByText(RETAINED)).toBeNull();
  });

  it('підтвердження лише скасовує — жодного запиту по гроші', () => {
    const onConfirm = renderDialog(visitWithDeposit('2026-10-02T09:00:00.000Z'));
    fireEvent.click(screen.getByRole('button', { name: 'Скасувати запис' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
