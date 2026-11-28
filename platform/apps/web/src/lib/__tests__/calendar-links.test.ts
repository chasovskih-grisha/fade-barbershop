import { googleCalendarUrl, icsDownloadPath } from '../calendar-links';

describe('calendar links (T-4446b)', () => {
  it('builds a dated Google Calendar link from the absolute visit times', () => {
    const url = googleCalendarUrl({
      title: 'FADE · Стрижка',
      start: '2026-07-15T09:00:00.000Z',
      end: '2026-07-15T10:00:00.000Z',
      location: 'FADE Сіті',
      details: 'Стрижка · Олексій',
    });

    expect(url).not.toBeNull();
    const parsed = new URL(String(url));
    expect(`${parsed.origin}${parsed.pathname}`).toBe(
      'https://calendar.google.com/calendar/render'
    );
    expect(parsed.searchParams.get('action')).toBe('TEMPLATE');
    expect(parsed.searchParams.get('dates')).toBe('20260715T090000Z/20260715T100000Z');
    expect(parsed.searchParams.get('text')).toBe('FADE · Стрижка');
    expect(parsed.searchParams.get('location')).toBe('FADE Сіті');
    expect(parsed.searchParams.get('details')).toBe('Стрижка · Олексій');
  });

  it('uses UTC stamps, so the winter visit keeps its instant', () => {
    const url = googleCalendarUrl({
      title: 'FADE · Стрижка',
      start: '2026-12-15T10:00:00.000Z',
      end: '2026-12-15T11:00:00.000Z',
    });

    expect(new URL(String(url)).searchParams.get('dates')).toBe(
      '20261215T100000Z/20261215T110000Z'
    );
  });

  it('returns null when the visit has no valid time', () => {
    expect(googleCalendarUrl({ title: 't', start: '', end: '' })).toBeNull();
    expect(
      googleCalendarUrl({ title: 't', start: 'not-a-date', end: '2026-07-15T10:00:00Z' })
    ).toBeNull();
  });

  it('points the download at the cookie proxy of the visit', () => {
    expect(icsDownloadPath('appointment-1')).toBe('/api/appointments/appointment-1/calendar');
    expect(icsDownloadPath('a/b')).toBe('/api/appointments/a%2Fb/calendar');
  });
});
