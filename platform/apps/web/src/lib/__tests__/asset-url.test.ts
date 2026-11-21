import { assetUrl } from '../asset-url';

describe('assetUrl', () => {
  it('keeps a string import', () => {
    expect(assetUrl('/brand/lockup-on-dark.svg')).toBe('/brand/lockup-on-dark.svg');
  });

  it('reads src from a Next static image module', () => {
    expect(assetUrl({ src: '/_next/static/media/lockup-on-dark.svg' })).toBe(
      '/_next/static/media/lockup-on-dark.svg'
    );
  });
});
