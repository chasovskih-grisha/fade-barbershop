import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { BarberDto } from '../../../lib/api/barbers';
import type { BookingServiceDto } from '../../../lib/api/booking';
import { BookingHeader } from './BookingHeader';
import { BookingLoading } from './BookingLoading';
import { BookingOutcomeSteps } from './BookingOutcomeSteps';
import { BookingSelectionSteps } from './BookingSelectionSteps';
import { STEP_TITLES, type Step } from './booking-step';
import { useBookingActions, usePreselectBarber } from './use-booking-actions';
import { useBookingCheckout } from './use-booking-checkout';
import { useBookingData } from './use-booking-data';
import { useBookingSlots } from './use-booking-slots';
import { styles } from '../../index.styles';

export default function BookingScreen() {
  const params = useLocalSearchParams<{ locationCode?: string; barberId?: string }>();
  const router = useRouter();
  const [step, setStep] = useState<Step>('service');
  const [service, setService] = useState<BookingServiceDto | null>(null);
  const [barber, setBarber] = useState<BarberDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const data = useBookingData(params.locationCode, setError);
  const slots = useBookingSlots({ location: data.location, service, barber, setError });
  const actions = useBookingActions({
    step,
    setStep,
    setService,
    setBarber,
    setError,
    date: slots.date,
    loadSlots: slots.loadSlots,
    clearSlot: slots.clearSlot,
    back: router.back,
  });
  const checkout = useBookingCheckout({
    location: data.location,
    service,
    barber,
    slot: slots.slot,
    date: slots.date,
    setError,
    onCreated: (booking) => setStep(booking.deposit ? 'payment' : 'done'),
    onPaid: () => setStep('done'),
    onConflict: actions.handleConflict,
  });
  usePreselectBarber(data.barbers, params.barberId, setBarber);

  if (data.loading && step === 'service') return <BookingLoading />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <BookingHeader
        title={STEP_TITLES[step]}
        locationName={data.location?.name}
        error={error}
        onBack={actions.goBack}
      />
      <BookingSelectionSteps
        step={step}
        services={data.services}
        barbers={data.barbers}
        date={slots.date}
        dateError={slots.dateError}
        slots={slots.slots}
        selectedSlot={slots.slot}
        service={service}
        barber={barber}
        catalogLoading={data.loading}
        slotsLoading={slots.loading}
        confirmLoading={checkout.loading}
        onService={actions.chooseService}
        onAnyBarber={() => actions.chooseBarber(null)}
        onBarber={actions.chooseBarber}
        onChangeDate={slots.changeDate}
        onLoadSlots={() => void slots.loadSlots()}
        onSelectSlot={(slot) => {
          slots.setSlot(slot);
          setStep('confirm');
        }}
        onConfirm={() => void checkout.confirm()}
      />
      <BookingOutcomeSteps
        step={step}
        created={checkout.created}
        payment={checkout.payment}
        remaining={checkout.remaining}
        paying={checkout.paying}
        onPay={() => void checkout.pay()}
        onChooseAnother={() => actions.chooseAnother(checkout.reset)}
        onAppointments={() => router.replace('/(client)/account/appointments')}
      />
    </ScrollView>
  );
}
