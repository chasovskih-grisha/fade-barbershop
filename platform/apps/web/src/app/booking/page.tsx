'use client';

// Флоу запису (T-041, booking-flow.md екрани 0–5): локація → послуга →
// барбер → слот (стрічка дат 14 днів) → зачіска/коментар → підтвердження через
// POST /booking/bookings (канал аналітики 'web' ставить сервер — ANL-004).
import { StepIndicator } from '@fade/ui';
import BookingHeader from './BookingHeader';
import BookingSummary from './BookingSummary';
import { BookingStepBody } from './booking-step-body';
import { STEPS, useBookingFlow } from './useBookingFlow';
import { useStepFocus } from './useStepFocus';

export default function BookingPage() {
  const flow = useBookingFlow();
  const { stepRef, errorRef } = useStepFocus(flow.step, flow.error);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:py-10">
      {' '}
      <BookingHeader />
      <BookingSummary flow={flow} />
      <StepIndicator steps={STEPS} current={flow.step} />
      {/* Анонс кроку (T-053av): скрін-рідер чує, куди перейшов флоу. */}
      <p role="status" aria-live="polite" className="sr-only">
        {`Крок ${Math.min(flow.step + 1, STEPS.length)} з ${STEPS.length}: ${STEPS[flow.step] ?? 'Готово'}`}
      </p>
      {flow.error && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="text-body rounded-[var(--radius-card)] bg-surface-sunken border border-line p-4 text-fg font-medium outline-none"
        >
          {flow.error}
        </p>
      )}
      <div ref={stepRef} tabIndex={-1} data-testid="booking-step" className="outline-none">
        <BookingStepBody flow={flow} />
      </div>
    </div>
  );
}
