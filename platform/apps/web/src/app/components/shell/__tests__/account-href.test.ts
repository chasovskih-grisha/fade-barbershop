import { accountHref, isPublicContentPath } from '../account-href';

// Призначення контролю акаунта (T-4715a): next лише для публічних контентних
// сторінок. /booking і /account — без next.

describe('accountHref', () => {
  it.each([
    '/',
    '/locations',
    '/locations/kyiv',
    '/services',
    '/services/haircut',
    '/barbers',
    '/barbers/oleh',
    '/blog',
    '/blog/post-1',
  ])('публічна сторінка %s передає next', (path) => {
    expect(isPublicContentPath(path)).toBe(true);
    expect(accountHref(path)).toBe(`/login?next=${encodeURIComponent(path)}`);
  });

  it.each(['/booking', '/booking/slot', '/account', '/account/appointments', '/login'])(
    '%s не передає next',
    (path) => {
      expect(isPublicContentPath(path)).toBe(false);
      expect(accountHref(path)).toBe('/login');
    }
  );
});
