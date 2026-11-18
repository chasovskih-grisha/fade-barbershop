// Тести TTL-парсера (T-014): env → секунди; сміття/нуль/негатив → дефолт.

import { accessTtlSec, refreshTtlSec } from './token-ttl';

describe('token TTL (T-014)', () => {
  const ORIGINAL = process.env;

  afterEach(() => {
    process.env = ORIGINAL;
    delete process.env.FADE_ACCESS_TTL_SEC;
    delete process.env.FADE_REFRESH_TTL_SEC;
  });

  it('дефолти без env: access 15 хв, refresh 30 днів', () => {
    expect(accessTtlSec()).toBe(15 * 60);
    expect(refreshTtlSec()).toBe(30 * 24 * 60 * 60);
  });

  it('валідний env читається', () => {
    process.env.FADE_ACCESS_TTL_SEC = '300';
    process.env.FADE_REFRESH_TTL_SEC = '604800';
    expect(accessTtlSec()).toBe(300);
    expect(refreshTtlSec()).toBe(604800);
  });

  it('сміття, нуль і негатив → дефолт (захист від некоректного конфіга)', () => {
    process.env.FADE_ACCESS_TTL_SEC = 'abc';
    expect(accessTtlSec()).toBe(15 * 60);
    process.env.FADE_ACCESS_TTL_SEC = '0';
    expect(accessTtlSec()).toBe(15 * 60);
    process.env.FADE_ACCESS_TTL_SEC = '-5';
    expect(accessTtlSec()).toBe(15 * 60);

    process.env.FADE_REFRESH_TTL_SEC = 'abc';
    expect(refreshTtlSec()).toBe(30 * 24 * 60 * 60);
    process.env.FADE_REFRESH_TTL_SEC = '0';
    expect(refreshTtlSec()).toBe(30 * 24 * 60 * 60);
  });
});
