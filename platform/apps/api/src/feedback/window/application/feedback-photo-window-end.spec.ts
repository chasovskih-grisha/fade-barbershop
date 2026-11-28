// Фото відгуку після кінця вікна (T-150a, FDB-003): ні завантажити, ні
// видалити відгук уже не можна — вікно прострочене.
import { FeedbackWindowClosed, windowEndsAtFor } from '../domain/feedback-window';
import { InMemoryFeedbackPhotoStorage } from './in-memory-feedback-photo-storage';
import { MemoryWindows } from './feedback-window.memory-repo';
import { FeedbackWindowService } from './feedback-window.service';
import { FeedbackPhotoService } from './feedback-photo.service';
import { FeedbackPhotoRemovalService } from './feedback-photo-removal.service';

const DAY = 24 * 60 * 60 * 1000;
const APPOINTMENT = 'apt-1';
const CLIENT = 'client-1';
const COMPLETED = new Date('2026-11-27T10:00:00.000Z');
const JPEG = new Uint8Array([0xff, 0xd8, 0xff]);

describe('FeedbackPhotoService: кінець вікна (T-150a)', () => {
  it('після кінця вікна фото не завантажуються і відгук не видаляється', async () => {
    const windows = new MemoryWindows();
    const storage = new InMemoryFeedbackPhotoStorage();
    const windowService = new FeedbackWindowService(windows);
    const photos = new FeedbackPhotoService(windows, storage, windowService);
    const removal = new FeedbackPhotoRemovalService(windows, storage, windowService);
    await windowService.open({
      appointmentId: APPOINTMENT,
      clientId: CLIENT,
      completedAt: COMPLETED,
    });
    const late = new Date(windowEndsAtFor(COMPLETED).getTime() + DAY);
    jest.useFakeTimers().setSystemTime(late);
    try {
      await expect(
        photos.addPhoto({
          appointmentId: APPOINTMENT,
          userId: CLIENT,
          contentType: 'image/jpeg',
          bytes: JPEG,
        })
      ).rejects.toBeInstanceOf(FeedbackWindowClosed);
      await expect(
        removal.removeReview({ appointmentId: APPOINTMENT, userId: CLIENT })
      ).rejects.toBeInstanceOf(FeedbackWindowClosed);
    } finally {
      jest.useRealTimers();
    }
  });
});
