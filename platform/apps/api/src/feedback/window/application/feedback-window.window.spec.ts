// Вікно відгуку (T-150): ідемпотентне відкриття на завершений візит, 30-денний
// дедлайн і прибирання прострочених. Сховище — пам'ять за тим самим портом.
import { FeedbackWindowClosed, windowEndsAtFor } from '../domain/feedback-window';
import { MemoryWindows } from './feedback-window.memory-repo';
import { FeedbackWindowService } from './feedback-window.service';

const DAY = 24 * 60 * 60 * 1000;
const APPOINTMENT = 'apt-1';
const CLIENT = 'client-1';
const COMPLETED = new Date('2026-11-27T10:00:00.000Z');

describe('FeedbackWindowService: вікно (T-150)', () => {
  let repo: MemoryWindows;
  let service: FeedbackWindowService;

  beforeEach(() => {
    repo = new MemoryWindows();
    service = new FeedbackWindowService(repo);
  });

  const opened = () =>
    service.open({ appointmentId: APPOINTMENT, clientId: CLIENT, completedAt: COMPLETED });

  it('відкриває вікно на 30 днів', async () => {
    const { created, window } = await opened();

    expect(created).toBe(true);
    expect(window.windowEndsAt).toBe(windowEndsAtFor(COMPLETED).toISOString());
    expect(window.status).toBe('open');
    expect(window.daysRemaining).toBe(30);
  });

  it('повторна доставка AppointmentCompleted не створює друге вікно', async () => {
    const first = await opened();
    const second = await opened();

    expect(second.created).toBe(false);
    expect(second.window.id).toBe(first.window.id);
    expect(repo.rows.size).toBe(1);
  });

  it('після 30 днів вікно показується простроченим і не приймає відгук', async () => {
    await opened();
    const late = new Date(COMPLETED.getTime() + 31 * DAY);
    jest.useFakeTimers().setSystemTime(late);
    try {
      await expect(
        service.submit({ appointmentId: APPOINTMENT, userId: CLIENT, rating: 5, text: 'пізно' })
      ).rejects.toBeInstanceOf(FeedbackWindowClosed);
      expect((await service.viewFor(APPOINTMENT, CLIENT)).status).toBe('expired');
    } finally {
      jest.useRealTimers();
    }
  });

  it('прибирання прострочених переводить open у expired і рахує змінені', async () => {
    await opened();
    await service.open({ appointmentId: 'apt-2', clientId: CLIENT, completedAt: COMPLETED });
    const late = new Date(COMPLETED.getTime() + 31 * DAY);

    expect(await service.expireOverdue(late)).toEqual({ expired: 2 });
    expect([...repo.rows.values()].every((row) => row.status === 'expired')).toBe(true);
    expect(await service.expireOverdue(new Date(late.getTime() + DAY))).toEqual({ expired: 0 });
  });
});
