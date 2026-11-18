import { DomainEvent, OtpRequested, UserRegistered, SessionStarted, SessionRevoked, BarberRegistered, BarberUpdated, BarberDeactivated, BarberActivated } from './events';
import { SESSION_1, USER_1 } from '../application/test-ids';
import { uuidv7 } from '@fade/domain-shared';

const BARBER_1 = uuidv7();
const BARBER_2 = uuidv7();

describe('identity domain events', () => {
  const at = new Date('2026-09-21T10:00:00.000Z');

  it('OtpRequested carries the phone as payload and aggregateId', () => {
    const e = new OtpRequested('+380501234567', at);
    expect(e.type).toBe('identity.otp.requested');
    // Дефолт purpose 'login' (T-4409 додав booking — у новому тесті нижче).
    expect(e.payload).toEqual({ phone: '+380501234567', purpose: 'login' });
    expect(e.aggregateId).toBe('+380501234567');
  });

  it('OtpRequested для телефонного запису несе purpose booking (T-4409)', () => {
    const e = new OtpRequested('+380501234567', at, 'booking');
    expect(e.payload).toMatchObject({ purpose: 'booking' });
  });

  it('UserRegistered carries id and phone', () => {
    const e = new UserRegistered(USER_1, '+380501234567', at);
    expect(e.type).toBe('identity.user.registered');
    expect(e.payload).toEqual({ id: USER_1, phone: '+380501234567' });
    expect(e.aggregateId).toBe(USER_1);
  });

  it('SessionStarted carries session metadata', () => {
    const e = new SessionStarted({ id: SESSION_1, userId: USER_1, channel: 'web' }, at);
    expect(e.type).toBe('identity.session.started');
    expect(e.payload).toEqual({ sessionId: SESSION_1, userId: USER_1, channel: 'web' });
  });

  it('SessionRevoked carries id and userId', () => {
    const e = new SessionRevoked({ id: SESSION_1, userId: USER_1 }, at);
    expect(e.type).toBe('identity.session.revoked');
    expect(e.payload).toEqual({ sessionId: SESSION_1, userId: USER_1 });
  });

  it('BarberRegistered carries id, phone and name', () => {
    const e = new BarberRegistered({ id: BARBER_1, phone: '+380501234567', name: 'Ivan' }, at);
    expect(e.type).toBe('identity.barber.registered');
    expect(e.payload).toEqual({ id: BARBER_1, phone: '+380501234567', name: 'Ivan' });
    const anonymous = new BarberRegistered(
      { id: BARBER_2, phone: '+380501234568', name: null },
      at
    );
    expect(anonymous.payload.name).toBeNull();
  });

  it('BarberUpdated carries changed fields', () => {
    const e = new BarberUpdated(BARBER_1, { name: 'Petro', selfSchedule: true }, at);
    expect(e.type).toBe('identity.barber.updated');
    expect(e.payload).toEqual({ id: BARBER_1 });
    expect(e.changed).toEqual({ name: 'Petro', selfSchedule: true });
  });

  it('BarberDeactivated and BarberActivated carry only the id', () => {
    const off = new BarberDeactivated(BARBER_1, at);
    const on = new BarberActivated(BARBER_1, at);
    expect(off.type).toBe('identity.barber.deactivated');
    expect(on.type).toBe('identity.barber.activated');
    expect(off.payload).toEqual({ id: BARBER_1 });
    expect(on.payload).toEqual({ id: BARBER_1 });
  });

  it('DomainEvent records occurredAt', () => {
    const e = new OtpRequested('+380501234567', at);
    expect(e.occurredAt).toEqual(at);
    expect(e instanceof DomainEvent).toBe(true);
  });
});
