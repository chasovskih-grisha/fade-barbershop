// Життєвий цикл фото відгуку (T-150a, FDB-003): показ лише власнику через
// підписаний URL, видалення відгуку до кінця вікна прибирає обʼєкти, після
// вікна — відмова; повторне видалення не падає.
import { NotTheWindowOwner } from '../domain/feedback-window';
import { PhotoNotFound } from '../domain/feedback-photo';
import { InMemoryFeedbackPhotoStorage } from './in-memory-feedback-photo-storage';
import { MemoryWindows } from './feedback-window.memory-repo';
import { FeedbackWindowService } from './feedback-window.service';
import { FeedbackPhotoService } from './feedback-photo.service';
import { FeedbackPhotoRemovalService } from './feedback-photo-removal.service';

const APPOINTMENT = 'apt-1';
const CLIENT = 'client-1';
const STRANGER = 'client-2';
const COMPLETED = new Date('2026-11-27T10:00:00.000Z');
const JPEG = new Uint8Array([0xff, 0xd8, 0xff]);

describe('FeedbackPhotoService: життєвий цикл (T-150a)', () => {
  let storage: InMemoryFeedbackPhotoStorage;
  let windows: MemoryWindows;
  let photos: FeedbackPhotoService;
  let removal: FeedbackPhotoRemovalService;

  beforeEach(async () => {
    storage = new InMemoryFeedbackPhotoStorage();
    windows = new MemoryWindows();
    const windowService = new FeedbackWindowService(windows);
    photos = new FeedbackPhotoService(windows, storage, windowService);
    removal = new FeedbackPhotoRemovalService(windows, storage, windowService);
    await windowService.open({
      appointmentId: APPOINTMENT,
      clientId: CLIENT,
      completedAt: COMPLETED,
    });
  });

  const uploaded = () =>
    photos.addPhoto({
      appointmentId: APPOINTMENT,
      userId: CLIENT,
      contentType: 'image/jpeg',
      bytes: JPEG,
    });

  it('показує фото власнику через підписаний URL і не показує чужому', async () => {
    const { photo } = await uploaded();

    const own = await photos.urlFor({
      appointmentId: APPOINTMENT,
      userId: CLIENT,
      photoId: photo.id,
    });
    expect(own.url).toContain(photo.id);
    expect(own.expiresInSeconds).toBeLessThanOrEqual(900);
    await expect(
      photos.urlFor({ appointmentId: APPOINTMENT, userId: STRANGER, photoId: photo.id })
    ).rejects.toBeInstanceOf(NotTheWindowOwner);
  });

  it('відсутнє у відгуку фото — 404, а не підписаний URL', async () => {
    await uploaded();
    await expect(
      photos.urlFor({ appointmentId: APPOINTMENT, userId: CLIENT, photoId: 'nope' })
    ).rejects.toBeInstanceOf(PhotoNotFound);
  });

  it('видалення відгуку прибирає обʼєкти й очищає подання', async () => {
    const first = await uploaded();
    await uploaded();

    const result = await removal.removeReview({ appointmentId: APPOINTMENT, userId: CLIENT });

    expect(result.removedPhotos).toBe(2);
    expect(storage.objects.size).toBe(0);
    expect(storage.removed).toContain(first.photo.id);
    const record = [...windows.rows.values()][0];
    expect(record).toMatchObject({ photos: [], rating: null, text: null, status: 'open' });
  });

  it('повторне видалення не падає на вже прибраних обʼєктах', async () => {
    await uploaded();
    await removal.removeReview({ appointmentId: APPOINTMENT, userId: CLIENT });

    await expect(
      removal.removeReview({ appointmentId: APPOINTMENT, userId: CLIENT })
    ).resolves.toEqual({ removedPhotos: 0 });
  });
});
