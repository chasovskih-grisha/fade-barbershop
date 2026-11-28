// Завантаження фото відгуку (T-150a): валідація типу й розміру до запису в
// бакет, ліміт трьох фото, у відгуку лишаються посилання, показ — підписаний URL.
import { MAX_FEEDBACK_PHOTO_BYTES, PHOTO_URL_TTL_SECONDS } from '../domain/feedback-photo';
import { PhotoTooLarge, TooManyPhotos, UnsupportedPhotoType } from '../domain/feedback-photo';
import { InMemoryFeedbackPhotoStorage } from './in-memory-feedback-photo-storage';
import { MemoryWindows } from './feedback-window.memory-repo';
import { FeedbackWindowService } from './feedback-window.service';
import { FeedbackPhotoService } from './feedback-photo.service';

const APPOINTMENT = 'apt-1';
const CLIENT = 'client-1';
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0]);

const BY_TYPE: Record<string, Uint8Array> = {
  'image/jpeg': JPEG,
  'image/png': PNG,
  'image/webp': WEBP,
};

describe('FeedbackPhotoService: завантаження (T-150a)', () => {
  let windows: MemoryWindows;
  let storage: InMemoryFeedbackPhotoStorage;
  let photos: FeedbackPhotoService;

  beforeEach(async () => {
    windows = new MemoryWindows();
    storage = new InMemoryFeedbackPhotoStorage();
    const windowService = new FeedbackWindowService(windows);
    photos = new FeedbackPhotoService(windows, storage, windowService);
    await windowService.open({ appointmentId: APPOINTMENT, clientId: CLIENT });
  });

  const upload = (contentType = 'image/jpeg', bytes?: Uint8Array) =>
    photos.addPhoto({
      appointmentId: APPOINTMENT,
      userId: CLIENT,
      contentType,
      bytes: bytes ?? BY_TYPE[contentType] ?? JPEG,
    });

  it('пише обʼєкт у бакет і лишає у відгуку посилання з підписаним URL', async () => {
    const first = await upload();

    expect(first.photo).toEqual({ id: expect.any(String), sortOrder: 0 });
    expect(first.url).toBe(`https://signed.test/${first.photo.id}?ttl=${PHOTO_URL_TTL_SECONDS}`);
    expect(storage.objects.get(first.photo.id)).toMatchObject({
      contentType: 'image/jpeg',
      sizeBytes: JPEG.byteLength,
    });
    const record = [...windows.rows.values()][0];
    expect(record?.photos).toEqual([first.photo]);
  });

  it('дозволяє рівно три фото, четверте відхиляє', async () => {
    await upload();
    await upload('image/png');
    await upload('image/webp');

    await expect(upload()).rejects.toBeInstanceOf(TooManyPhotos);
    expect(storage.objects.size).toBe(3);
  });

  it('відхиляє тип, який не є jpg/png/webp, і не пише в бакет', async () => {
    await expect(upload('application/pdf')).rejects.toBeInstanceOf(UnsupportedPhotoType);
    await expect(upload('')).rejects.toBeInstanceOf(UnsupportedPhotoType);
    expect(storage.objects.size).toBe(0);
  });

  it('відхиляє файл понад 5 МБ до запису в бакет', async () => {
    const big = new Uint8Array(MAX_FEEDBACK_PHOTO_BYTES + 1);
    big.set(JPEG.slice(0, 3));
    await expect(upload('image/jpeg', big)).rejects.toBeInstanceOf(PhotoTooLarge);
    expect(storage.objects.size).toBe(0);
  });
  it('подання відгуку несе лише завантажені фото, чужі id відкидаються', async () => {
    const first = await upload();
    await upload();
    const windowService = new FeedbackWindowService(windows);

    const kept = await windowService.submit({
      appointmentId: APPOINTMENT,
      userId: CLIENT,
      rating: 5,
      text: 'ок',
      photoIds: [first.photo.id, 'not-uploaded'],
    });
    expect(kept.photos).toEqual([first.photo]);

    const cleared = await windowService.submit({
      appointmentId: APPOINTMENT,
      userId: CLIENT,
      rating: 5,
      text: 'ок',
      photoIds: ['not-uploaded'],
    });
    expect(cleared.photos).toEqual([]);
  });
});
