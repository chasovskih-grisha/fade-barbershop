// T-4587: мапа подій, санітизація PII, детермінований insert_id, ретраї.
import {
  AMPLITUDE_EVENT_MAP,
  FORWARDED_EVENT_TYPES,
  amplitudeEventName,
  insertId,
  retryAt,
  sanitizePayload,
  toAmplitudeEvent,
  type DomainEventRecord,
} from './amplitude-events';

const AT = new Date('2026-11-17T10:00:00Z');
const record = (over: Partial<DomainEventRecord> = {}): DomainEventRecord => ({
  id: 'evt-1',
  type: 'scheduling.appointment.booked',
  aggregateId: 'appt-1',
  payload: { appointmentId: 'appt-1', clientId: 'client-1', phone: '+380501112233' },
  occurredAt: AT,
  ...over,
});

describe('amplitude events (T-4587)', () => {
  it('мапить доменні події на імена Amplitude', () => {
    expect(amplitudeEventName('scheduling.appointment.booked')).toBe('booking_confirmed');
    expect(amplitudeEventName('billing.payment.captured')).toBe('payment_captured');
    expect(amplitudeEventName('unknown.event')).toBeNull();
    expect(FORWARDED_EVENT_TYPES.length).toBe(Object.keys(AMPLITUDE_EVENT_MAP).length);
  });

  it('будує подію з user_id і без PII у властивостях', () => {
    const event = toAmplitudeEvent(record());

    expect(event).toMatchObject({
      event_type: 'booking_confirmed',
      user_id: 'client-1',
      time: AT.getTime(),
    });
    expect(event?.event_properties).toEqual({ appointmentId: 'appt-1', clientId: 'client-1' });
  });

  it('insert_id детермінований і включає агрегат і час', () => {
    const event = toAmplitudeEvent(record());
    expect(event?.insert_id).toBe(insertId('booking_confirmed', record()));
    expect(event?.insert_id).toContain('appt-1');
    expect(toAmplitudeEvent(record({ aggregateId: 'appt-2' }))?.insert_id).not.toBe(
      event?.insert_id
    );
  });

  it('невідомий тип не перетворюється у подію', () => {
    expect(toAmplitudeEvent(record({ type: 'scheduling.appointment.reference_changed' }))).toBeNull();
  });

  it('санітизація вирізає PII-ключі та схожі на контакти рядки', () => {
    expect(
      sanitizePayload({
        phone: '+380501112233',
        clientEmail: 'a@b.c',
        barberName: 'Іван',
        comment: 'стрижка',
        contact: '+380671112233',
        locationId: 'loc-1',
        amount: 350,
      })
    ).toEqual({ locationId: 'loc-1', amount: 350 });
  });

  it('ретраї йдуть за розкладом і після 5 спроб дають dead letter', () => {
    expect([1, 2, 3, 4, 5].map((attempt) => retryAt(attempt, AT)?.toISOString())).toEqual([
      '2026-11-17T10:01:00.000Z',
      '2026-11-17T10:05:00.000Z',
      '2026-11-17T10:15:00.000Z',
      '2026-11-17T11:00:00.000Z',
      '2026-11-17T16:00:00.000Z',
    ]);
    expect(retryAt(6, AT)).toBeNull();
  });
});
