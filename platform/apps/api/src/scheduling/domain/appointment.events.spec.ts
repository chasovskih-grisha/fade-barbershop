// Специфікація доменних подій Appointment (T-042): payload містить лише
// визначені поля (exactOptional — без undefined-ключів), occurredAt за
// замовчуванням — зараз. Події — чистий домен, без Nest і Prisma.
import { AppointmentBooked, AppointmentCancelled, AppointmentCompleted, AppointmentConfirmed, AppointmentNoShowed, AppointmentReferenceChanged, AppointmentRescheduled, AppointmentStarted, type AppointmentEventInput } from './appointment.events';

const T0 = new Date('2026-11-02T09:00:00Z');
const base: AppointmentEventInput = {
  appointmentId: 'apt-1',
  locationId: 'loc-1',
  barberId: 'barber-1',
  start: '10:00',
  end: '10:30',
  occurredAt: T0,
};
const idOnly: AppointmentEventInput = {
  appointmentId: 'apt-1',
  locationId: 'loc-1',
  barberId: 'b',
};

type Ctor = new (input: AppointmentEventInput) => { readonly payload: Record<string, string> };

const cases: Array<[Ctor, AppointmentEventInput, Record<string, string>]> = [
  [
    AppointmentBooked,
    base,
    {
      appointmentId: 'apt-1',
      locationId: 'loc-1',
      barberId: 'barber-1',
      start: '10:00',
      end: '10:30',
    },
  ],
  [AppointmentBooked, idOnly, { appointmentId: 'apt-1', locationId: 'loc-1', barberId: 'b' }],
  [AppointmentConfirmed, idOnly, { appointmentId: 'apt-1' }],
  // prettier-ignore
  [AppointmentConfirmed, { ...idOnly, actorId: 'admin-1', actorRole: 'admin' }, { appointmentId: 'apt-1', actorId: 'admin-1', actorRole: 'admin' }],
  // prettier-ignore
  [AppointmentStarted, { ...idOnly, actorId: 'barber-1', actorRole: 'barber' }, { appointmentId: 'apt-1', actorId: 'barber-1', actorRole: 'barber' }],
  // prettier-ignore
  [AppointmentRescheduled, { ...base, start: '11:00', end: '11:30', actorId: 'client-1', actorRole: 'client' }, { appointmentId: 'apt-1', start: '11:00', end: '11:30', actorId: 'client-1', actorRole: 'client' }],
  [AppointmentRescheduled, idOnly, { appointmentId: 'apt-1', start: '', end: '' }],
  // prettier-ignore
  [AppointmentCancelled, { ...idOnly, actorId: 'admin-1', actorRole: 'admin', reason: 'плани' }, { appointmentId: 'apt-1', actorId: 'admin-1', actorRole: 'admin', reason: 'плани' }],
  [AppointmentCancelled, idOnly, { appointmentId: 'apt-1' }],
  [
    AppointmentCompleted,
    base,
    { appointmentId: 'apt-1', locationId: 'loc-1', barberId: 'barber-1' },
  ],
  [
    AppointmentNoShowed,
    { ...idOnly, actorRole: 'barber' },
    { appointmentId: 'apt-1', actorRole: 'barber' },
  ],
  // prettier-ignore
  [AppointmentReferenceChanged, { ...idOnly, referenceId: 'ref-42', comment: 'зняти на 2 мм', actorId: 'client-1', actorRole: 'client' }, { appointmentId: 'apt-1', haircutReferenceId: 'ref-42', comment: 'зняти на 2 мм', actorId: 'client-1', actorRole: 'client' }],
  [AppointmentReferenceChanged, idOnly, { appointmentId: 'apt-1' }],
];

describe('Доменні події Appointment (payload contract)', () => {
  it.each(cases)('%p формує payload лише з переданих полів', (ctor, input, expected) => {
    const event = new ctor(input);
    expect(event.payload).toEqual(expected);
  });

  it('occurredAt за замовчуванням — зараз; з передачею — точне значення', () => {
    const before = new Date().getTime();
    const now = new AppointmentConfirmed(idOnly);
    const after = new Date().getTime();
    expect(now.occurredAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.occurredAt.getTime()).toBeLessThanOrEqual(after);
    expect(new AppointmentBooked(base).occurredAt).toBe(T0);
  });

  it('типи подій за конвенцією scheduling.appointment.*', () => {
    expect(new AppointmentBooked(base)).toMatchObject({ type: 'scheduling.appointment.booked' });
    // prettier-ignore
    expect(new AppointmentNoShowed(idOnly)).toMatchObject({ type: 'scheduling.appointment.no_showed' });
  });
});
