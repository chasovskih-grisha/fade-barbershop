// SetBarberPhoto (T-4610a): інваріант «лише User з роллю barber», обов'язкова
// згода, завантаження і заміна через публічний медіа-конвеєр.
import { InvalidBarberInputError, BarberNotFoundError } from './barber-errors';
import { PNG, barberUser, setup } from './barber-photo.fakes';
import { USER_1, USER_2, testId } from './test-ids';

describe('SetBarberPhotoHandler (T-4610a)', () => {
  it('завантажує фото барбера із згодою і зберігає consentAt/consentBy', async () => {
    const t = setup();
    await t.users.save(barberUser(USER_1, 'barber'));

    const photo = await t.setPhoto.handle({
      userId: USER_1,
      alt: 'Іван, барбер',
      consent: true,
      adminIdentifier: 'admin-1',
      file: PNG,
    });

    expect(photo.consentAt).toBeInstanceOf(Date);
    expect(photo.consentBy).toBe('admin-1');
    expect(photo.objectKey).toMatch(/^barbers\//);
    expect(await t.photos.findByUserId(USER_1)).not.toBeNull();
  });

  it('без згоди фото не публікується (InvalidBarberInputError)', async () => {
    const t = setup();
    await t.users.save(barberUser(USER_1, 'barber'));

    await expect(
      t.setPhoto.handle({
        userId: USER_1,
        alt: 'Іван',
        consent: false,
        adminIdentifier: 'admin-1',
        file: PNG,
      })
    ).rejects.toBeInstanceOf(InvalidBarberInputError);
    expect(await t.photos.findByUserId(USER_1)).toBeNull();
  });

  it('не-барбер (клієнт) → BarberNotFoundError, фото не зберігається', async () => {
    const t = setup();
    await t.users.save(barberUser(USER_2, 'client'));

    await expect(
      t.setPhoto.handle({
        userId: USER_2,
        alt: 'Іван',
        consent: true,
        adminIdentifier: 'admin-1',
        file: PNG,
      })
    ).rejects.toBeInstanceOf(BarberNotFoundError);
    expect(await t.photos.findByUserId(USER_2)).toBeNull();
  });

  it('невідомий userId → BarberNotFoundError', async () => {
    const t = setup();

    await expect(
      t.setPhoto.handle({
        userId: testId(),
        alt: 'Іван',
        consent: true,
        adminIdentifier: 'admin-1',
        file: PNG,
      })
    ).rejects.toBeInstanceOf(BarberNotFoundError);
  });

  it('заміна фото видаляє попередній об`єкт із сховища', async () => {
    const t = setup();
    await t.users.save(barberUser(USER_1, 'barber'));
    const first = await t.setPhoto.handle({
      userId: USER_1,
      alt: 'Іван',
      consent: true,
      adminIdentifier: 'admin-1',
      file: PNG,
    });

    const second = await t.setPhoto.handle({
      userId: USER_1,
      alt: 'Іван оновлено',
      consent: true,
      adminIdentifier: 'admin-1',
      file: PNG,
    });

    expect(t.media.objects.has(first.objectKey)).toBe(false);
    expect(t.media.objects.has(second.objectKey)).toBe(true);
  });

  it('непідтримуваний тип файлу відхиляється до завантаження', async () => {
    const t = setup();
    await t.users.save(barberUser(USER_1, 'barber'));

    await expect(
      t.setPhoto.handle({
        userId: USER_1,
        alt: 'Іван',
        consent: true,
        adminIdentifier: 'admin-1',
        file: { bytes: new Uint8Array([1]), contentType: 'application/pdf' },
      })
    ).rejects.toBeInstanceOf(InvalidBarberInputError);
    expect(t.media.objects.size).toBe(0);
  });
});
