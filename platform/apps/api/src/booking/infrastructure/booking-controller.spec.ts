// Специфікація BookingController (T-041): барбери — лише активні призначені
// локації (MNG-ADM-05/06); слот без вільного барбера або з повними кріслами —
// disabled (barbers: []), не схований (екран 3). Збірка — booking-controller.fakes.ts.
import { Booking } from '../../scheduling/domain/booking';
import { SLOT_REQUEST, makeBookingController } from './booking-controller.fakes';

describe('BookingController availability', () => {
  it('shows only active barbers assigned to this location (MNG-ADM-05/06)', async () => {
    const listed = await makeBookingController().listBarbers('loc-1');

    expect(listed.map((b) => b.id)).toEqual(['', 'b1', 'b2']);
    expect(listed[0]).toEqual({ id: '', name: 'Будь-який барбер', any: true });
  });

  it('drops an unassigned barber even if globally active', async () => {
    const listed = await makeBookingController([], ['b1']).listBarbers('loc-1');

    expect(listed.map((b) => b.id)).toEqual(['', 'b1']);
  });

  it('uses the requested date weekday and omits a barber who is already booked', async () => {
    // prettier-ignore
    const existing = [Booking.create({ barberId: 'b1', locationId: 'loc-1', start: new Date('2026-10-05T09:00:00Z'), end: new Date('2026-10-05T10:00:00Z') })];

    const slots = await makeBookingController(existing).listSlots(SLOT_REQUEST);

    expect(slots.find((slot) => slot.start === '09:00')?.barbers).toEqual(['b2']);
  });

  it('keeps a fully occupied slot in the strip as disabled (barbers: [])', async () => {
    // prettier-ignore
    const existing = [
      Booking.create({ barberId: 'b1', locationId: 'loc-1', start: new Date('2026-10-05T09:00:00Z'), end: new Date('2026-10-05T10:00:00Z') }),
      Booking.create({ barberId: 'b2', locationId: 'loc-1', start: new Date('2026-10-05T09:15:00Z'), end: new Date('2026-10-05T10:15:00Z') }),
    ];

    const slots = await makeBookingController(existing).listSlots(SLOT_REQUEST);

    expect(slots.find((slot) => slot.start === '09:15')).toEqual({
      start: '09:15',
      end: '09:45',
      barbers: [],
    });
  });

  it('keeps the whole strip disabled on a day no barber schedule covers', async () => {
    // вівторок — графіки лише на понеділок
    const slots = await makeBookingController().listSlots({ ...SLOT_REQUEST, date: '2026-10-06' });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((slot) => slot.barbers.length === 0)).toBe(true);
  });

  it('disables the whole strip for an inactive specific barber', async () => {
    const slots = await makeBookingController().listSlots({
      ...SLOT_REQUEST,
      barberId: 'inact',
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((slot) => slot.barbers.length === 0)).toBe(true);
  });
});
