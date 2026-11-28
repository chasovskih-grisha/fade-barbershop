// Подання відгуку і нагадування (T-150): оцінка з текстом і фото, редагування
// до кінця вікна, чужому клієнту — відмова, нагадування через 2 години — одне.
import { InvalidFeedback, NotTheWindowOwner } from '../domain/feedback-window';
import { MemoryWindows } from './feedback-window.memory-repo';
import { FeedbackWindowService } from './feedback-window.service';

const HOUR = 60 * 60 * 1000;
const APPOINTMENT = 'apt-1';
const CLIENT = 'client-1';
const STRANGER = 'client-2';
const COMPLETED = new Date('2026-11-27T10:00:00.000Z');

describe('FeedbackWindowService: подання (T-150)', () => {
  let repo: MemoryWindows;
  let service: FeedbackWindowService;

  beforeEach(async () => {
    repo = new MemoryWindows();
    service = new FeedbackWindowService(repo);
    await service.open({ appointmentId: APPOINTMENT, clientId: CLIENT, completedAt: COMPLETED });
  });

  it('подання робить вікно submitted і зберігає оцінку, текст і фото', async () => {
    const view = await service.submit({
      appointmentId: APPOINTMENT,
      userId: CLIENT,
      rating: 5,
      text: '  Найкраща стрижка  ',
      photoIds: ['p1', 'p2'],
    });

    expect(view.status).toBe('submitted');
    expect(view.rating).toBe(5);
    expect(view.text).toBe('Найкраща стрижка');
    // Фото додаються завантаженням (T-150a); самі id їх не створюють.
    expect(view.photos).toEqual([]);
    expect(view.submittedAt).toEqual(expect.any(String));
  });

  it('повторне подання редагує відгук, а не створює другий', async () => {
    await service.submit({ appointmentId: APPOINTMENT, userId: CLIENT, rating: 4, text: 'Ок' });
    const edited = await service.submit({
      appointmentId: APPOINTMENT,
      userId: CLIENT,
      rating: 3,
      text: 'Передумав',
    });

    expect(edited.rating).toBe(3);
    expect(edited.text).toBe('Передумав');
    expect(repo.rows.size).toBe(1);
  });

  it('відхиляє оцінку поза 1–5, довгий текст і понад три фото', async () => {
    const base = { appointmentId: APPOINTMENT, userId: CLIENT, text: 'ок' };

    await expect(service.submit({ ...base, rating: 0 })).rejects.toBeInstanceOf(InvalidFeedback);
    await expect(service.submit({ ...base, rating: 6 })).rejects.toBeInstanceOf(InvalidFeedback);
    await expect(
      service.submit({ ...base, rating: 5, text: 'x'.repeat(1001) })
    ).rejects.toBeInstanceOf(InvalidFeedback);
    await expect(
      service.submit({ ...base, rating: 5, photoIds: ['1', '2', '3', '4'] })
    ).rejects.toBeInstanceOf(InvalidFeedback);
  });

  it('чужий клієнт не бачить і не подає вікно', async () => {
    await expect(service.viewFor(APPOINTMENT, STRANGER)).rejects.toBeInstanceOf(NotTheWindowOwner);
    await expect(
      service.submit({ appointmentId: APPOINTMENT, userId: STRANGER, rating: 5, text: 'x' })
    ).rejects.toBeInstanceOf(NotTheWindowOwner);
  });

  it('нагадування через 2 години — рівно одне', async () => {
    const early = await service.reminderFor(APPOINTMENT, new Date(COMPLETED.getTime() + HOUR));
    const due = await service.reminderFor(APPOINTMENT, new Date(COMPLETED.getTime() + 2 * HOUR));
    const again = await service.reminderFor(APPOINTMENT, new Date(COMPLETED.getTime() + 3 * HOUR));

    expect(early.due).toBe(false);
    expect(due).toMatchObject({ due: true, clientId: CLIENT });
    expect(again.due).toBe(false);
    expect(repo.rows.get(due.windowId)?.remindedAt).toBeInstanceOf(Date);
  });
});
