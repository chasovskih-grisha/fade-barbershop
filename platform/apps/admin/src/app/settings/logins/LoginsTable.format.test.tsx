// Юніт-тести форматерів журналу входів (Kyiv timezone, shortUserId).
import { formatTimestamp, shortUserId } from './LoginsTable';

describe('LoginsTable formatters', () => {
  it('formatTimestamp renders DD.MM.YYYY HH:mm in Europe/Kyiv', () => {
    expect(formatTimestamp('2026-09-28T10:15:00.000Z')).toBe('28.09.2026 13:15');
    expect(formatTimestamp('not-a-date')).toBe('not-a-date');
  });

  it('shortUserId truncates to 8 chars for the admin column', () => {
    expect(shortUserId('7ae64d23-63cb-27de-caf0-67a7a3505014')).toBe('7ae64d23');
  });
});
