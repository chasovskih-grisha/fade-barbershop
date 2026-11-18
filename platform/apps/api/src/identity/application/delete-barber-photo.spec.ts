// DeleteBarberPhoto (T-4610a): відкликання фото знімає публікацію і прибирає
// об'єкт із публічного сховища; не-барбер — помилка; без фото — тихий no-op.
import { BarberNotFoundError } from './barber-errors';
import { PNG, barberUser, setup } from './barber-photo.fakes';
import { USER_1, USER_2 } from './test-ids';

describe('DeleteBarberPhotoHandler (T-4610a)', () => {
  it('видаляє фото і його об`єкт із публічного сховища', async () => {
    const t = setup();
    await t.users.save(barberUser(USER_1, 'barber'));
    const photo = await t.setPhoto.handle({
      userId: USER_1,
      alt: 'Іван',
      consent: true,
      adminIdentifier: 'admin-1',
      file: PNG,
    });

    await t.deletePhoto.handle(USER_1);

    expect(await t.photos.findByUserId(USER_1)).toBeNull();
    expect(t.media.objects.has(photo.objectKey)).toBe(false);
  });

  it('не-барбер → BarberNotFoundError', async () => {
    const t = setup();
    await t.users.save(barberUser(USER_2, 'client'));

    await expect(t.deletePhoto.handle(USER_2)).rejects.toBeInstanceOf(BarberNotFoundError);
  });

  it('немає фото → тихий no-op (ідемпотентно)', async () => {
    const t = setup();
    await t.users.save(barberUser(USER_1, 'barber'));

    await expect(t.deletePhoto.handle(USER_1)).resolves.toBeUndefined();
  });
});
