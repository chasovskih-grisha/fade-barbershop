// Прибирання окремого фото й перевірка підпису файлу (T-150a): власник може
// зняти одне фото до подання, а об'єкт із бакета зникає разом із посиланням.
import { PhotoNotFound, UnsupportedPhotoType } from '../domain/feedback-photo';
import { InMemoryFeedbackPhotoStorage } from './in-memory-feedback-photo-storage';
import { MemoryWindows } from './feedback-window.memory-repo';
import { FeedbackWindowService } from './feedback-window.service';
import { FeedbackPhotoService } from './feedback-photo.service';
import { FeedbackPhotoRemovalService } from './feedback-photo-removal.service';

const APPOINTMENT = 'apt-1';
const CLIENT = 'client-1';
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

describe('FeedbackPhotoRemovalService (T-150a)', () => {
  let windows: MemoryWindows;
  let storage: InMemoryFeedbackPhotoStorage;
  let photos: FeedbackPhotoService;
  let removal: FeedbackPhotoRemovalService;

  beforeEach(async () => {
    windows = new MemoryWindows();
    storage = new InMemoryFeedbackPhotoStorage();
    const windowService = new FeedbackWindowService(windows);
    photos = new FeedbackPhotoService(windows, storage, windowService);
    removal = new FeedbackPhotoRemovalService(windows, storage, windowService);
    await windowService.open({ appointmentId: APPOINTMENT, clientId: CLIENT });
  });

  const upload = (contentType: string, bytes: Uint8Array) =>
    photos.addPhoto({ appointmentId: APPOINTMENT, userId: CLIENT, contentType, bytes });

  it('прибирає одне фото, лишає решту в порядку й звільняє місце під нове', async () => {
    const first = await upload('image/jpeg', JPEG);
    const second = await upload('image/png', PNG);
    const third = await upload('image/jpeg', JPEG);

    const result = await removal.removePhoto({
      appointmentId: APPOINTMENT,
      userId: CLIENT,
      photoId: first.photo.id,
    });

    expect(result.photos).toEqual([
      { id: second.photo.id, sortOrder: 0 },
      { id: third.photo.id, sortOrder: 1 },
    ]);
    expect(storage.objects.has(first.photo.id)).toBe(false);
    expect(storage.objects.size).toBe(2);

    const replacement = await upload('image/png', PNG);
    expect(replacement.photo.sortOrder).toBe(2);
  });

  it('невідоме фото — 404, і жоден обʼєкт не чіпається', async () => {
    const kept = await upload('image/jpeg', JPEG);

    await expect(
      removal.removePhoto({ appointmentId: APPOINTMENT, userId: CLIENT, photoId: 'nope' })
    ).rejects.toBeInstanceOf(PhotoNotFound);
    expect(storage.objects.has(kept.photo.id)).toBe(true);
  });

  it('відхиляє файл, чий підпис не збігається з оголошеним типом', async () => {
    await expect(upload('image/png', JPEG)).rejects.toBeInstanceOf(UnsupportedPhotoType);
    expect(storage.objects.size).toBe(0);
  });
});
