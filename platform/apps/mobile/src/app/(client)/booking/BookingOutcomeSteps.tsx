import type { CreatedBooking, DepositPayment } from '../../../lib/api/booking';
import { BookingDoneStep } from './BookingDoneStep';
import { BookingPaymentStep } from './BookingPaymentStep';
import type { Step } from './booking-step';

interface BookingOutcomeStepsProps {
  step: Step;
  created: CreatedBooking | null;
  payment: DepositPayment | null;
  remaining: number;
  paying: boolean;
  onPay: () => void;
  onChooseAnother: () => void;
  onAppointments: () => void;
}

export function BookingOutcomeSteps(props: BookingOutcomeStepsProps) {
  if (props.step === 'payment' && props.created?.deposit) {
    return (
      <BookingPaymentStep
        amount={props.created.deposit.amount}
        remaining={props.remaining}
        payment={props.payment}
        loading={props.paying}
        onPay={props.onPay}
        onChooseAnother={props.onChooseAnother}
      />
    );
  }
  if (props.step === 'done' && props.created) {
    return (
      <BookingDoneStep
        hasDeposit={Boolean(props.created.deposit)}
        payment={props.payment}
        onAppointments={props.onAppointments}
      />
    );
  }
  return null;
}
