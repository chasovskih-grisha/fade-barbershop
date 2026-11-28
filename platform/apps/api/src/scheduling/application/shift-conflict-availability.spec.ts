/* eslint-disable max-lines -- T-4616b: сім перевірок доступності ділять одну фікстуру конфлікту, графіка й матриці; рознесення по файлах подвоїло б її. */
// T-4616b: «чи є інший барбер» — не косметична підказка, а основа рішення
// засновника (перенести чи скасувати). Тому перевірка йде тим самим шляхом, що
// й запис: графік барбера, години локації, матриця «барбер × послуга», вікна
// недоступності й зайнятість. Раніше цей клас лише заглушували в інших спеках.
import { BarberSchedule } from '../domain/availability';
import { OpeningHours } from '../../locations/domain/opening-hours';
import { barbersForService } from '../domain/barber-service-matrix';
import type { ShiftConflictData } from '../domain/barber-unavailability';
import type { Booking } from '../domain/booking';
import { SchedulingShiftConflictAvailability } from './shift-conflict-availability';

/** 24 листопада 2026 — вівторок (Monday-first індекс 1). */
const DAY = 1;
const start = new Date('2026-11-24T09:00:00.000Z');
const end = new Date('2026-11-24T09:30:00.000Z');

const conflict: ShiftConflictData = {
  id: 'conflict-1',
  appointmentId: 'appointment-1',
  bookingId: 'booking-1',
  partyId: null,
  barberId: 'b1',
  locationId: 'loc1',
  clientId: 'client-1',
  serviceId: 'service-1',
  start,
  end,
  status: 'open',
  resolution: null,
  resolvedBarberId: null,
  resolvedAt: null,
  createdAt: new Date('2026-11-23T08:00:00.000Z'),
};

function hours(): OpeningHours {
  return OpeningHours.of(
    Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      open: '08:00',
      close: '20:00',
      closed: false,
    }))
  );
}

function schedule(barberId: string, window = { start: '09:00', end: '18:00' }) {
  return BarberSchedule.create({
    barberId,
    locationId: 'loc1',
    windows: [{ dayOfWeek: DAY, ...window }],
  });
}

/** Матриця: хто з барберів виконує service-1 у loc1. Порожня — фолбек «усі». */
function matrix(assignments: Record<string, string[]>) {
  return {
    matrix: new Map(
      Object.entries(assignments).map(([barberId, services]) => [
        barberId,
        new Map([['loc1', new Set(services)]]),
      ])
    ),
  };
}

function setup(
  options: {
    schedules?: ReturnType<typeof schedule>[];
    location?: { hours: OpeningHours } | null;
    unavailability?: string[];
    busy?: string[];
    assignments?: Record<string, string[]>;
  } = {}
) {
  const availability = new SchedulingShiftConflictAvailability({
    schedules: { listAllByLocation: async () => options.schedules ?? [] },
    locations: {
      findById: async () => ('location' in options ? (options.location ?? null) : { hours: hours() }),
    },
    bookings: {
      findBarberOverlaps: async ({ barberId }) =>
        (options.busy ?? []).includes(barberId) ? ([{ id: 'booking-x' }] as Booking[]) : [],
    },
    unavailabilities: {
      covers: async ({ barberId }) => (options.unavailability ?? []).includes(barberId),
    },
    barberServices: {
      snapshotForLocation: async () =>
        matrix(options.assignments ?? { b2: ['service-1'] }) as never,
    },
  });
  return availability;
}

describe('SchedulingShiftConflictAvailability (T-4616b)', () => {
  it('бачить вільного кваліфікованого барбера в тому ж слоті', async () => {
    const availability = setup({
      schedules: [schedule('b1'), schedule('b2')],
      assignments: { b2: ['service-1'] },
    });

    await expect(availability.hasOtherBarber(conflict)).resolves.toBe(true);
  });

  it('не рахує кандидатом барбера, який не виконує послугу', async () => {
    const availability = setup({
      // b2 має графік, але матриця віддає послугу лише b3, а b3 у відпустці за графіком.
      schedules: [schedule('b1'), schedule('b2'), schedule('b3', { start: '12:00', end: '18:00' })],
      assignments: { b3: ['service-1'] },
    });

    await expect(availability.hasOtherBarber(conflict)).resolves.toBe(false);
  });

  it('не рахує кандидатом барбера з вікном поза слотом', async () => {
    const availability = setup({
      schedules: [schedule('b1'), schedule('b2', { start: '12:00', end: '18:00' })],
    });

    await expect(availability.hasOtherBarber(conflict)).resolves.toBe(false);
  });

  it('не рахує кандидатом барбера, який сам недоступний у цьому слоті', async () => {
    const availability = setup({
      schedules: [schedule('b1'), schedule('b2')],
      unavailability: ['b2'],
    });

    await expect(availability.hasOtherBarber(conflict)).resolves.toBe(false);
  });

  it('не рахує кандидатом барбера, у якого вже є візит на цей час', async () => {
    const availability = setup({
      schedules: [schedule('b1'), schedule('b2')],
      busy: ['b2'],
    });

    await expect(availability.hasOtherBarber(conflict)).resolves.toBe(false);
  });

  it('без локації або без чужого графіка — вільного барбера немає', async () => {
    await expect(setup({ location: null }).hasOtherBarber(conflict)).resolves.toBe(false);
    await expect(setup({ schedules: [schedule('b1')] }).hasOtherBarber(conflict)).resolves.toBe(
      false
    );
  });

  it('без послуги на конфлікті бере будь-кого з графіком, без матриці', async () => {
    const availability = setup({
      schedules: [schedule('b1'), schedule('b2')],
      assignments: {},
    });

    await expect(
      availability.hasOtherBarber({ ...conflict, serviceId: null })
    ).resolves.toBe(true);
  });

  // Матриця лише звужує коло; порожній результат — фолбек «усі барбери локації».
  it('порожня матриця не лишає засновника без варіантів', () => {
    expect(barbersForService(matrix({}).matrix, { locationId: 'loc1', serviceId: 'service-1' }, [
      'b2',
    ])).toEqual(new Set(['b2']));
  });
});
