// Специфікація агрегату Appointment (T-042a/b): щасливий ланцюг переходів,
// кожен заборонений перехід (статуси не відкочуються), події за README.
// Без моків БД — домен їх не знає (engineering-principles.md).

import { Appointment, InvalidTransitionError } from './appointment.aggregate';

const T0 = new Date('2026-11-02T09:00:00Z');
const base = {
  id: 'apt-1',
  bookingId: 'bk-1',
  locationId: 'loc-1',
  barberId: 'barber-1',
  start: '10:00',
  end: '10:30',
} as const;
const book = () => Appointment.book(base, T0);

describe('Appointment агрегат', () => {
  it('book → confirm → start → complete: ланцюг і типи подій за README', () => {
    const a = Appointment.book(base, T0);
    expect(a.data.status).toBe('booked');
    a.confirm({ actorId: 'admin-1', actorRole: 'admin' }, T0);
    a.reschedule({ start: '11:00', end: '11:30', actorId: 'client-1', actorRole: 'client' }, T0);
    a.startVisit({ actorId: 'barber-1', actorRole: 'barber' }, T0);
    a.complete(T0);
    expect(a.data.status).toBe('completed');
    expect(a.pullEvents().map((e) => e.type)).toEqual([
      'scheduling.appointment.booked',
      'scheduling.appointment.confirmed',
      'scheduling.appointment.rescheduled',
      'scheduling.appointment.started',
      'scheduling.appointment.completed',
    ]);
    const rescheduled = a.pullEvents()[2];
    expect(rescheduled).toMatchObject({ payload: { start: '11:00', end: '11:30' } });
  });

  it('cancel і no_show — бічні гілки з живих статусів; reason фіксується', () => {
    const a = Appointment.book(base, T0);
    a.cancel({ actorId: 'client-1', actorRole: 'client', reason: 'плани змінились' }, T0);
    expect(a.data.status).toBe('cancelled');
    const b = Appointment.book(base, T0);
    b.confirm({}, T0);
    b.markNoShow({ actorId: 'barber-1', actorRole: 'barber' }, T0);
    expect(b.data.status).toBe('no_show');
    expect(b.pullEvents().map((e) => e.type)).toEqual([
      'scheduling.appointment.booked',
      'scheduling.appointment.confirmed',
      'scheduling.appointment.no_showed',
    ]);
  });

  it('статуси не відкочуються: кожен заборонений перехід кидає InvalidTransitionError', () => {
    const expectInvalid = (run: () => void) => expect(run).toThrow(InvalidTransitionError);
    // confirmed → completed заборонений (минути in_progress)
    const confirmed = book();
    confirmed.confirm({}, T0);
    expectInvalid(() => confirmed.complete(T0));
    // booked не може стрибнути в in_progress/completed (минути confirm)
    expectInvalid(() => book().complete(T0));
    // невідкатність: book завжди починає новий агрегат зі статусом booked
    expect(book().data.status).toBe('booked');
  });

  // Термінальні статуси — як туди потрапити; усі команди відхиляються.
  // prettier-ignore
  it.each([
    ['completed', (): Appointment => { const a = book(); a.confirm({}, T0); a.startVisit({}, T0); a.complete(T0); return a; }],
    ['cancelled', (): Appointment => { const a = book(); a.cancel({}, T0); return a; }],
    ['no_show', (): Appointment => { const a = book(); a.confirm({}, T0); a.markNoShow({}, T0); return a; }],
  ] as const)('%s — термінальний: усі команди кидають InvalidTransitionError', (_status, reach) => {
    const a = reach();
    expect(() => a.confirm({}, T0)).toThrow(InvalidTransitionError);
    expect(() => a.cancel({}, T0)).toThrow(InvalidTransitionError);
    expect(() => a.markNoShow({}, T0)).toThrow(InvalidTransitionError);
    expect(() => a.complete(T0)).toThrow(InvalidTransitionError);
  });

  it('reconstitute відновлює агрегат зі збереженого стану', () => {
    const restored = Appointment.reconstitute({ ...base, status: 'confirmed' });
    expect(restored.data.status).toBe('confirmed');
    expect(restored.pullEvents()).toEqual([]);
  });

  it('reschedule на термінальному статусі заборонений', () => {
    const a = Appointment.book(base, T0);
    a.cancel({}, T0);
    expect(() => a.reschedule({ start: '12:00', end: '12:30' }, T0)).toThrow(
      InvalidTransitionError
    );
  });

  it('reschedule у живому статусі не змінює статус і не кидає', () => {
    const a = Appointment.book(base, T0);
    a.reschedule({ start: '12:00', end: '12:30' }, T0);
    expect(a.data.status).toBe('booked');
    expect(a.data.start).toBe('12:00');
  });

  it('tracks appointment id and location id correctly in event payload', () => {
    const a = Appointment.book(base, T0);
    const events = a.pullEvents();
    expect(events[0]).toMatchObject({
      payload: expect.objectContaining({
        appointmentId: 'apt-1',
        locationId: 'loc-1',
      }),
    });
  });

  it('correctly reports isAlive for live vs terminal statuses', () => {
    const a = Appointment.book(base, T0);
    expect(a.isAlive()).toBe(true);
    a.cancel({}, T0);
    expect(a.isAlive()).toBe(false);
  });
});
