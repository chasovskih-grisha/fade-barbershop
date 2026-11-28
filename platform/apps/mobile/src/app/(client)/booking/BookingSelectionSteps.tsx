import type { BookingServiceDto, BookingSlotDto } from '../../../lib/api/booking';
import type { BarberDto } from '../../../lib/api/barbers';
import { BookingBarberStep } from './BookingBarberStep';
import { BookingConfirmStep } from './BookingConfirmStep';
import { BookingServiceStep } from './BookingServiceStep';
import { BookingSlotStep } from './BookingSlotStep';
import type { Step } from './booking-step';

interface BookingSelectionStepsProps {
  step: Step;
  services: BookingServiceDto[];
  barbers: BarberDto[];
  date: string;
  dateError: string | null;
  slots: BookingSlotDto[];
  selectedSlot: BookingSlotDto | null;
  service: BookingServiceDto | null;
  barber: BarberDto | null;
  catalogLoading: boolean;
  slotsLoading: boolean;
  confirmLoading: boolean;
  onService: (service: BookingServiceDto) => void;
  onAnyBarber: () => void;
  onBarber: (barber: BarberDto) => void;
  onChangeDate: (value: string) => void;
  onLoadSlots: () => void;
  onSelectSlot: (slot: BookingSlotDto) => void;
  onConfirm: () => void;
}

export function BookingSelectionSteps(props: BookingSelectionStepsProps) {
  if (props.step === 'service') {
    return (
      <BookingServiceStep
        services={props.services}
        loading={props.catalogLoading}
        onSelect={props.onService}
      />
    );
  }
  if (props.step === 'barber') {
    return (
      <BookingBarberStep
        barbers={props.barbers}
        onAny={props.onAnyBarber}
        onSelect={props.onBarber}
      />
    );
  }
  if (props.step === 'slot') {
    return (
      <BookingSlotStep
        date={props.date}
        dateError={props.dateError}
        slots={props.slots}
        loading={props.slotsLoading}
        onChangeDate={props.onChangeDate}
        onLoad={props.onLoadSlots}
        onSelect={props.onSelectSlot}
      />
    );
  }
  if (props.step === 'confirm' && props.service && props.selectedSlot) {
    return (
      <BookingConfirmStep
        service={props.service}
        slot={props.selectedSlot}
        date={props.date}
        barber={props.barber}
        loading={props.confirmLoading}
        onConfirm={props.onConfirm}
      />
    );
  }
  return null;
}
