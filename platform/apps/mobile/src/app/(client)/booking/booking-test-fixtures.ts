import type { BookingServiceDto, BookingSlotDto, CreatedBooking } from '../../../lib/api/booking';
import type { BarberDto } from '../../../lib/api/barbers';
import type { LocationDto } from '../../../lib/api/locations';

export const bookingLocation: LocationDto = {
  id: 'loc-1',
  code: 'clt-01',
  name: 'FADE Central',
  address: 'Тепла, 5',
  addressParts: null,
  lat: 50.44,
  lng: 30.49,
  phone: null,
  email: null,
  active: true,
  hours: [],
  chairs: [],
  channels: [],
  photos: [],
  logo: null,
};

export const bookingService: BookingServiceDto = {
  id: 'svc-1',
  name: 'Стрижка',
  price: 700,
  duration: 60,
};

export const bookingBarber: BarberDto = { id: 'barber-1', name: 'Олександр' };

export const bookingSlot: BookingSlotDto = {
  start: '10:00',
  end: '11:00',
  barbers: ['barber-1'],
};

export function depositBooking(expiresInMs = 15 * 60_000): CreatedBooking {
  const serverNow = new Date();
  return {
    id: 'booking-1',
    deposit: {
      amount: 210,
      expiresAt: new Date(serverNow.getTime() + expiresInMs).toISOString(),
      serverNow: serverNow.toISOString(),
      resumeToken: 'resume-booking-1',
    },
  };
}
