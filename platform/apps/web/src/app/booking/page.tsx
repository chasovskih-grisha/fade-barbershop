'use client';

// Флоу запису (T-041, booking-flow.md екрани 0–5): локація → послуга →
// барбер → слот (стрічка дат 14 днів) → зачіска/коментар → підтвердження через
// POST /booking/bookings (канал аналітики 'web' ставить сервер — ANL-004).
import { StepIndicator } from '@fade/ui';
import LocationStep from './steps/LocationStep';
import ServiceStep from './steps/ServiceStep';
import Step2 from './steps/step2';
import SlotStep from './steps/SlotStep';
import HaircutReferenceStep from './steps/HaircutReferenceStep';
import CommentStep from './steps/CommentStep';
import PaymentStep from './steps/PaymentStep';
import SuccessStep from './steps/SuccessStep';
import BookingHeader from './BookingHeader';
import BookingSummary from './BookingSummary';
import { STEPS, useBookingFlow } from './useBookingFlow';
import { useStepFocus } from './useStepFocus';
import { pickInstantSlot } from './instant-slot';

export default function BookingPage() {
  const flow = useBookingFlow();
  const { stepRef, errorRef } = useStepFocus(flow.step, flow.error);
  // eslint-disable-next-line complexity -- dispatch лише за номером кроку
  const render = () => {
    switch (flow.step) {
      case 0:
        return <LocationStep onSelect={flow.chooseLocation} />;
      case 1:
        // prettier-ignore
        return <ServiceStep services={flow.services} loading={flow.loading} onBack={() => flow.setStep(0)} onSelect={flow.chooseService} />;
      case 2:
        return <Step2 flow={flow} />;
      case 3:
        // prettier-ignore
        return <SlotStep slots={flow.slots} days={flow.days} date={flow.date} loading={flow.loading} selectedSlot={flow.slot} onDate={flow.chooseDate} onSelect={flow.chooseSlot} onBack={() => flow.setStep(2)} onNext={() => flow.setStep(4)} onJoinWaitlist={flow.onJoinWaitlist} onCancelWaitlist={flow.onCancelWaitlist} waitlist={flow.waitlist} instantSlot={pickInstantSlot(flow.slots, flow.date)} onInstantBook={(slot) => { flow.chooseSlot(slot); flow.setStep(5); }} />;
      case 4:
        // prettier-ignore
        return <HaircutReferenceStep
          referenceSource={flow.referenceSource}
          setReferenceSource={flow.setReferenceSource}
          selectedVariantObjectKey={flow.selectedVariantObjectKey}
          setSelectedVariantObjectKey={flow.setSelectedVariantObjectKey}
          uploadedPhoto={flow.uploadedPhoto}
          setUploadedPhoto={flow.setUploadedPhoto}
          comment={flow.comment}
          setComment={flow.setComment}
          onBack={() => flow.setStep(3)}
          onNext={() => flow.setStep(5)}
          loading={flow.loading}
        />;
      case 5:
        // prettier-ignore
        return <CommentStep
          comment={flow.comment}
          setComment={flow.setComment}
          onBack={() => flow.setStep(4)}
          onConfirm={() => void flow.confirm()}
          submitting={flow.submitting}
          locationName={flow.location?.name}
          serviceName={flow.service?.name}
          durationMinutes={flow.service?.duration}
          price={flow.service?.price}
          barberName={flow.barbers.find((b) => b.id === flow.barberId)?.name}
          time={flow.slot ? `${flow.slot.start}–${flow.slot.end}` : undefined}
        />;
      case 6:
        // T-4619b: крок існує лише для візиту з фактичним утриманням.
        // prettier-ignore
        return flow.deposit ? <PaymentStep bookingId={flow.bookingId} amount={flow.deposit.amount} expiresAt={flow.deposit.expiresAt} serverNow={flow.deposit.serverNow} {...(flow.deposit.resumeToken ? { resumeToken: flow.deposit.resumeToken } : {})} onCaptured={() => flow.setStep(7)} /> : null;
      case 7:
        return (
          <SuccessStep
            bookingId={flow.bookingId}
            locationName={flow.location?.name}
            serviceName={flow.service?.name}
            barberName={flow.barbers.find((b) => b.id === flow.barberId)?.name}
            time={flow.slot ? `${flow.slot.start}–${flow.slot.end}` : undefined}
            comment={flow.comment}
            referencePhotoId={flow.selectedVariantObjectKey}
            referencePreview={flow.uploadedPhoto}
          />
        );
      default:
        return null;
    }
  };

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
        {render()}
      </div>
    </div>
  );
}
