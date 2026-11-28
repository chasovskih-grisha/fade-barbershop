'use client';

// Тіло кроків флоу запису (T-041, booking-flow.md екрани 0–5): таблиця переходів
// замість switch у сторінці — каркас лишається в page.tsx, а кожен крок отримує
// власний рядок (LOC-гейт і складність на функцію, ADR 0019).
import type { ReactNode } from 'react';
import LocationStep from './steps/LocationStep';
import ServiceStep from './steps/ServiceStep';
import Step2 from './steps/step2';
import SlotStep from './steps/SlotStep';
import HaircutReferenceStep from './steps/HaircutReferenceStep';
import CommentStep from './steps/CommentStep';
import PaymentStep from './steps/PaymentStep';
import SuccessStep from './steps/SuccessStep';
import { useBookingFlow } from './useBookingFlow';
import { pickInstantSlot } from './instant-slot';

type Flow = ReturnType<typeof useBookingFlow>;
type StepView = (flow: Flow) => ReactNode;

// Індекс масиву — номер кроку; крок без запису (або 6 без утримання) не рендерить нічого.
const STEP_VIEWS: ReadonlyArray<StepView | null> = [
  (flow) => <LocationStep onSelect={flow.chooseLocation} />,
  (flow) => (
    // prettier-ignore
    <ServiceStep services={flow.services} loading={flow.loading} onBack={() => flow.setStep(0)} onSelect={flow.chooseService} />
  ),
  (flow) => <Step2 flow={flow} />,
  (flow) => (
    // prettier-ignore
    <SlotStep slots={flow.slots} days={flow.days} date={flow.date} loading={flow.loading} selectedSlot={flow.slot} onDate={flow.chooseDate} onSelect={flow.chooseSlot} onBack={() => flow.setStep(2)} onNext={() => flow.setStep(4)} onJoinWaitlist={flow.onJoinWaitlist} onCancelWaitlist={flow.onCancelWaitlist} waitlist={flow.waitlist} instantSlot={pickInstantSlot(flow.slots, flow.date)} onInstantBook={(slot) => { flow.chooseSlot(slot); flow.setStep(5); }} />
  ),
  (flow) => (
    // prettier-ignore
    <HaircutReferenceStep
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
    />
  ),
  (flow) => (
    // prettier-ignore
    <CommentStep
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
    />
  ),
  // T-4619b: крок існує лише для візиту з фактичним утриманням.
  (flow) =>
    flow.deposit ? (
      // prettier-ignore
      <PaymentStep bookingId={flow.bookingId} amount={flow.deposit.amount} expiresAt={flow.deposit.expiresAt} serverNow={flow.deposit.serverNow} {...(flow.deposit.resumeToken ? { resumeToken: flow.deposit.resumeToken } : {})} onCaptured={() => flow.setStep(7)} />
    ) : null,
  (flow) => (
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
  ),
];

export function BookingStepBody({ flow }: { flow: Flow }) {
  return STEP_VIEWS[flow.step]?.(flow) ?? null;
}
