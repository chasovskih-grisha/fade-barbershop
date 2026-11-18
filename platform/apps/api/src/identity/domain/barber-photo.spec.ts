// Інваріанти доменної моделі фото барбера (T-4610a): alt обов'язковий і
// обмежений, ключ об'єкта непорожній, необов'язкові поля дефолтяться в null.
import { buildBarberPhoto, InvalidBarberPhotoError } from './barber-photo';
import { uuidv7 } from '@fade/domain-shared';

const USER_ID = uuidv7();
const ADMIN_ID = uuidv7();

const BASE = { userId: USER_ID, objectKey: 'barbers/user-1/photo-1', alt: 'Іван' };

describe('buildBarberPhoto', () => {
  it('будує фото з обов`язковими полями і null-дефолтами', () => {
    const photo = buildBarberPhoto(BASE);

    expect(photo).toMatchObject({
      userId: USER_ID,
      objectKey: 'barbers/user-1/photo-1',
      alt: 'Іван',
      width: null,
      height: null,
      consentAt: null,
      consentBy: null,
    });
    expect(photo.updatedAt).toBeInstanceOf(Date);
  });

  it('обрізає alt і objectKey від пробілів', () => {
    const photo = buildBarberPhoto({ ...BASE, alt: '  Іван  ', objectKey: '  key  ' });

    expect(photo.alt).toBe('Іван');
    expect(photo.objectKey).toBe('key');
  });

  it('відхиляє порожній alt (фото = контент, alt обов`язковий)', () => {
    expect(() => buildBarberPhoto({ ...BASE, alt: '   ' })).toThrow(InvalidBarberPhotoError);
  });

  it('відхиляє alt довший за 120 символів', () => {
    expect(() => buildBarberPhoto({ ...BASE, alt: 'x'.repeat(121) })).toThrow(
      InvalidBarberPhotoError
    );
  });

  it('відхиляє порожній ключ об`єкта', () => {
    expect(() => buildBarberPhoto({ ...BASE, objectKey: '  ' })).toThrow(InvalidBarberPhotoError);
  });

  it('зберігає згоду: consentAt + consentBy фіксуються разом', () => {
    const at = new Date('2026-11-12T10:00:00.000Z');
    const photo = buildBarberPhoto({ ...BASE, consentAt: at, consentBy: ADMIN_ID });

    expect(photo.consentAt).toEqual(at);
    expect(photo.consentBy).toBe(ADMIN_ID);
  });
});
