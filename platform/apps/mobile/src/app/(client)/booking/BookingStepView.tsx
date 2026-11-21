import BarbersStep from './BarbersStep';
import ConfirmStep from './ConfirmStep';
import DoneStep from './DoneStep';
import LocationStep from './LocationStep';
import ServicesStep from './ServicesStep';
import SlotsStep from './SlotsStep';
import type { BarberDto, BookingSlot, BookingStep, LocationDto, ServiceDto } from './booking-model';

export default function BookingStepView({
  step,
  locations,
  location,
  services,
  serviceIds,
  barbers,
  barber,
  slots,
  slot,
  onLocation,
  onToggleService,
  onBarber,
  onSlot,
  onNext,
  onBack,
  onDone,
}: {
  step: BookingStep;
  locations: LocationDto[];
  location: LocationDto | null;
  services: ServiceDto[];
  serviceIds: string[];
  barbers: BarberDto[];
  barber: BarberDto | null;
  slots: BookingSlot[];
  slot: BookingSlot | null;
  onLocation: (value: LocationDto) => void;
  onToggleService: (id: string) => void;
  onBarber: (value: BarberDto) => void;
  onSlot: (value: BookingSlot) => void;
  onNext: () => void;
  onBack: () => void;
  onDone: () => void;
}) {
  if (step === 'location') {
    return <LocationStep locations={locations} selected={location} onSelect={onLocation} />;
  }
  if (step === 'services') {
    return (
      <ServicesStep
        services={services}
        selected={serviceIds}
        onToggle={onToggleService}
        onNext={onNext}
      />
    );
  }
  if (step === 'barbers') {
    return <BarbersStep barbers={barbers} selected={barber} onSelect={onBarber} onNext={onNext} />;
  }
  if (step === 'slots') {
    return <SlotsStep slots={slots} selected={slot} onSelect={onSlot} onNext={onNext} />;
  }
  if (step === 'confirm' && location && barber && slot) {
    return (
      <ConfirmStep
        location={location}
        barber={barber}
        slot={slot}
        services={services}
        serviceIds={serviceIds}
        onSubmit={onNext}
        onCancel={onBack}
      />
    );
  }
  return <DoneStep onClose={onDone} />;
}
