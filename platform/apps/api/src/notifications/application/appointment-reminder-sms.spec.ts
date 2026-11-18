// Текст нагадування (T-080): короткий, людьми мовою, у межах однієї SMS.
import { SMS_LENGTH_LIMIT, renderReminderSms } from './appointment-reminder-sms';
import { parseAppointmentReminderSettings } from '../domain/appointment-reminder-settings';

describe('renderReminderSms', () => {
  it('містить час, місце і послугу; укладається в одну сегменту', () => {
    const text = renderReminderSms({
      start: '2026-10-02T10:00:00.000Z',
      locationName: 'FADE Podil',
      locationAddress: 'вул. Хрещатик 1',
      serviceName: 'Чоловіча стрижка',
    });

    expect(text.split('\n')[0]).toBe('FADE: нагадування про візит');
    expect(text).toContain('FADE Podil, вул. Хрещатик 1');
    expect(text).toContain('Чоловіча стрижка');
    expect(text.length).toBeLessThanOrEqual(SMS_LENGTH_LIMIT);
  });

  it('порожні поля не дають порожніх рядків (візит без локації/послуги)', () => {
    const text = renderReminderSms({ start: '2026-10-02T10:00:00.000Z' });
    expect(text.split('\n')).toHaveLength(3);
    expect(text).toContain('2 жовтня 2026'); // час у Europe/Kyiv (UTC+3)
    expect(text).toContain('13:00');
    expect(text.endsWith('Зателефонуйте, якщо плани змінилися.')).toBe(true);
  });
});

describe('parseAppointmentReminderSettings', () => {
  it('коректне значення проходить без змін', () => {
    expect(parseAppointmentReminderSettings({ channel: 'none', leadMinutes: 90 })).toEqual({
      channel: 'none',
      leadMinutes: 90,
    });
  });

  it('невідоме/пошкоджене → дефолт (sms, добу)', () => {
    expect(parseAppointmentReminderSettings(null)).toEqual({ channel: 'sms', leadMinutes: 1440 });
    expect(parseAppointmentReminderSettings({ channel: 'viber', leadMinutes: 'доби' })).toEqual({
      channel: 'sms',
      leadMinutes: 1440,
    });
  });

  it('leadMinutes поза межами затискається (5 → 15, 99999 → тиждень)', () => {
    expect(parseAppointmentReminderSettings({ leadMinutes: 5 }).leadMinutes).toBe(15);
    expect(parseAppointmentReminderSettings({ leadMinutes: 99_999 }).leadMinutes).toBe(10_080);
  });
});
