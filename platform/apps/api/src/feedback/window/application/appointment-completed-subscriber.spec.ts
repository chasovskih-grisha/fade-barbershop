// Підписка вікна відгуку на завершений візит (T-150, ADR 0016): перша
// доставка відкриває вікно, реплей не відкриває друге, чужі події й візити
// без учасників ігноруються.
import { MemoryWindows } from './feedback-window.memory-repo';
import { FeedbackWindowService } from './feedback-window.service';
import {
  APPOINTMENT_COMPLETED_TYPE,
  AppointmentCompletedFeedbackWindows,
  type VisitParties,
} from './appointment-completed-subscriber';

const VISIT = 'apt-1';
const CLIENT = 'client-1';
const BARBER = 'barber-1';
const COMPLETED_AT = new Date('2026-11-27T18:00:00.000Z');

const parties: Record<string, VisitParties | null> = {
  [VISIT]: { clientId: CLIENT, barberId: BARBER, locationId: 'loc-1' },
};

const completed = (payload: Record<string, unknown> = { appointmentId: VISIT }) => ({
  type: APPOINTMENT_COMPLETED_TYPE,
  occurredAt: COMPLETED_AT,
  payload,
});

describe('AppointmentCompletedFeedbackWindows (T-150)', () => {
  let repo: MemoryWindows;
  let subscriber: AppointmentCompletedFeedbackWindows;

  beforeEach(() => {
    repo = new MemoryWindows();
    subscriber = new AppointmentCompletedFeedbackWindows({
      visits: { partiesOf: async (id: string) => parties[id] ?? null },
      windows: new FeedbackWindowService(repo),
    });
  });

  it('перша доставка відкриває вікно з часом завершення візиту', async () => {
    const result = await subscriber.handleOne(completed());

    expect(result).toEqual({ handled: true, created: true });
    const [row] = [...repo.rows.values()];
    expect(row).toMatchObject({ clientId: CLIENT, barberId: BARBER, completedAt: COMPLETED_AT });
  });

  it('повторна доставка не відкриває друге вікно', async () => {
    await subscriber.handleOne(completed());
    const replay = await subscriber.handleOne(completed());

    expect(replay).toEqual({ handled: true, created: false });
    expect(repo.rows.size).toBe(1);
  });

  it('події іншого типу не створюють вікно', async () => {
    const result = await subscriber.handleOne({
      type: 'scheduling.appointment.booked',
      occurredAt: COMPLETED_AT,
      payload: { appointmentId: VISIT },
    });

    expect(result).toEqual({ handled: false });
    expect(repo.rows.size).toBe(0);
  });

  it('візит без учасників або без id у пейлоаді — не наш', async () => {
    expect(await subscriber.handleOne(completed({ appointmentId: 'unknown' }))).toEqual({
      handled: false,
    });
    expect(await subscriber.handleOne(completed({}))).toEqual({ handled: false });
    expect(repo.rows.size).toBe(0);
  });
});
