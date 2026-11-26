// T-093/T-4404: гроші дня очима барбера. Барбер тримає в руках готівку й
// термінал, але досі бачив лише кнопку «оплатити» — не те, скільки він узяв,
// скільки лишилось винним і скільки з того — депозити. Це read-only зведення
// за київську добу; комісії та чайові лишаються T-4546.
import {
  PaymentForm,
  PaymentStatus,
  isCapturedPaymentStatus,
} from '../../billing/domain/payment-status.enum';
import { kyivDayRange } from './kyiv-day-range';

export { kyivDayRange };

export interface BarberDayPayment {
  amount: number;
  form: PaymentForm;
  status: PaymentStatus;
}

export interface BarberDayVisit {
  bookingId: string;
  status: string;
  /** Підсумкова ціна візиту; 0 — ціни немає. */
  finalPrice: number;
  payments: BarberDayPayment[];
}

export interface BarberDayMoneyPort {
  visitsFor(barberId: string, from: Date, to: Date): Promise<BarberDayVisit[]>;
}

export interface BarberDayMoneyView {
  date: string;
  /** Візити доби (усі статуси). */
  visits: number;
  /** Завершені візити — лише вони формують «мало бути». */
  completed: number;
  /** Скільки мав коштувати день за завершеними візитами. */
  expected: number;
  /** Скільки фактично списано/прийнято. */
  collected: number;
  /** Різниця expected − collected за завершеними (≥ 0). */
  outstanding: number;
  /** Розбивка прийнятого за формою оплати. */
  byForm: { cash: number; pos: number; card: number; certificate: number };
}

const COMPLETED = 'completed';

export class BarberDayMoney {
  constructor(private readonly deps: { visits: BarberDayMoneyPort }) {}

  async execute(barberId: string, date: string): Promise<BarberDayMoneyView | null> {
    const range = kyivDayRange(date);
    if (!range) return null;

    const visits = await this.deps.visits.visitsFor(barberId, range.from, range.to);
    const view: BarberDayMoneyView = {
      date,
      visits: visits.length,
      completed: 0,
      expected: 0,
      collected: 0,
      outstanding: 0,
      byForm: { cash: 0, pos: 0, card: 0, certificate: 0 },
    };

    for (const visit of visits) {
      const completed = visit.status === COMPLETED;
      if (completed) {
        view.completed += 1;
        view.expected += visit.finalPrice;
      }
      for (const payment of visit.payments) {
        if (!isCapturedPaymentStatus(payment.status)) continue;
        view.collected += payment.amount;
        view.byForm[formKey(payment.form)] += payment.amount;
      }
    }
    view.outstanding = Math.max(0, view.expected - collectedForCompleted(visits));
    return view;
  }
}

/** Прийняте саме за завершеними візитами — з ним і порівнюється `expected`. */
function collectedForCompleted(visits: BarberDayVisit[]): number {
  return visits
    .filter((visit) => visit.status === COMPLETED)
    .reduce(
      (sum, visit) =>
        sum +
        visit.payments
          .filter((payment) => isCapturedPaymentStatus(payment.status))
          .reduce((paid, payment) => paid + payment.amount, 0),
      0
    );
}

function formKey(form: PaymentForm): keyof BarberDayMoneyView['byForm'] {
  if (form === PaymentForm.CASH) return 'cash';
  if (form === PaymentForm.POS) return 'pos';
  if (form === PaymentForm.CERTIFICATE) return 'certificate';
  return 'card';
}
