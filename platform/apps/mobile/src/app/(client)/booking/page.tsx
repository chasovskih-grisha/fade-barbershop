import { useState } from 'react';
import { ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MobileSkeleton } from '../../../ui/kit';
import { wipStyles } from '../../wip-styles';
import BookingStepView from './BookingStepView';
import { buildSlots, nextStep, previousStep, selectedDuration } from './booking-model';
import type { BarberDto, BookingSlot, BookingStep, LocationDto } from './booking-model';
import { useBookingData } from './use-booking-data';

export default function BookingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<BookingStep>('location');
  const [location, setLocation] = useState<LocationDto | null>(null);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [barber, setBarber] = useState<BarberDto | null>(null);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [slot, setSlot] = useState<BookingSlot | null>(null);
  const { locations, services, barbers, loading, failed } = useBookingData(location);

  const selectLocation = (next: LocationDto) => {
    setLocation(next);
    setStep('services');
  };

  const toggleService = (id: string) => {
    setServiceIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const selectBarber = (next: BarberDto) => {
    setBarber(next);
    setSlots(buildSlots(selectedDuration(services, serviceIds)));
    setStep('slots');
  };

  const advance = () => setStep(nextStep(step));
  const goBack = () => setStep(previousStep(step));

  return (
    <SafeAreaView style={wipStyles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={wipStyles.content} style={wipStyles.scroll}>
        <View style={wipStyles.header}>
          <Text style={wipStyles.title}>Запис на візит</Text>
        </View>
        {loading ? <MobileSkeleton /> : null}
        {failed ? <Text style={wipStyles.muted}>Не вдалося завантажити дані</Text> : null}
        {!loading && !failed ? (
          <BookingStepView
            step={step}
            locations={locations}
            location={location}
            services={services}
            serviceIds={serviceIds}
            barbers={barbers}
            barber={barber}
            slots={slots}
            slot={slot}
            onLocation={selectLocation}
            onToggleService={toggleService}
            onBarber={selectBarber}
            onSlot={setSlot}
            onNext={advance}
            onBack={goBack}
            onDone={() => router.back()}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
