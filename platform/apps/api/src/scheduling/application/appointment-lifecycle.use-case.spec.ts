// Функціональна специфікація AppointmentLifecycle (T-042a/b): кожна команда
// зберігає агрегат (події чіпляються), барбер не може cancel/reschedule,
// невідомий id → помилка, заборонені переходи — InvalidTransitionError.

import { InvalidTransitionError } from '../domain/appointment.aggregate';
import { AppointmentNotFoundError } from './appointment-lifecycle.use-case';
import { bookedAppointment, lifecycleCmd, setupLifecycle } from './appointment-lifecycle.fakes';

const booked = bookedAppointment;
const cmd = lifecycleCmd;

describe('AppointmentLifecycle', () => {
  it('confirm → start → complete: агрегат зберігається, статуси рухаються вперед', async () => {
    const { lifecycle, repo } = setupLifecycle(booked());
    await lifecycle.confirm(cmd);
    await lifecycle.start(cmd);
    await lifecycle.complete(cmd);
    expect(repo.saved.at(-1)?.data?.status).toBe('completed');
    expect(
      repo.saved
        .at(-1)
        ?.pullEvents()
        .map((e) => e.type)
    ).toContain('scheduling.appointment.completed');
  });

  it('клієнт скасовує і переносить; події cancel/rescheduled фіксуються', async () => {
    const { lifecycle, repo } = setupLifecycle(booked());
    await lifecycle.reschedule({
      ...cmd,
      actorId: 'client-1',
      actorRole: 'client',
      start: '11:00',
      end: '11:30',
    });
    expect(repo.saved[0]?.data?.start).toBe('11:00');
    await lifecycle.cancel({
      ...cmd,
      actorId: 'client-1',
      actorRole: 'client',
      reason: 'не зможу',
    });
    expect(repo.saved.at(-1)?.data?.status).toBe('cancelled');
  });

  it('cancel без причини зберігається з порожнім cancelReason', async () => {
    const { lifecycle, repo } = setupLifecycle(booked());
    await lifecycle.cancel({ ...cmd, actorRole: 'client', actorId: 'client-1' });
    expect(repo.saved.at(-1)?.data?.status).toBe('cancelled');
    expect(repo.saved.at(-1)?.data?.cancelReason).toBe('');
  });

  it('барбер не може cancel і reschedule (README: клієнт або адмін)', async () => {
    const { lifecycle } = setupLifecycle(booked());
    const barberCmd = { ...cmd, actorRole: 'barber' as const, actorId: 'barber-1' };
    await expect(lifecycle.cancel({ ...barberCmd, reason: 'хочу' })).rejects.toThrow(
      'Barber cannot cancel'
    );
    await expect(
      lifecycle.reschedule({ ...barberCmd, start: '11:00', end: '11:30' })
    ).rejects.toThrow('Barber cannot reschedule');
  });

  it('невідомий id → AppointmentNotFoundError', async () => {
    const { lifecycle } = setupLifecycle(booked());
    await expect(lifecycle.confirm({ ...cmd, appointmentId: 'nope' })).rejects.toBeInstanceOf(
      AppointmentNotFoundError
    );
  });

  it('заборонений перехід (complete з booked) не записує нічого', async () => {
    const { lifecycle, repo } = setupLifecycle(booked());
    await expect(lifecycle.complete(cmd)).rejects.toBeInstanceOf(InvalidTransitionError);
    expect(repo.saved).toHaveLength(0);
  });

  it('markNoShow барбером — дозволено (дія на кріслі)', async () => {
    const { lifecycle, repo } = setupLifecycle(booked());
    await lifecycle.markNoShow({ ...cmd, actorRole: 'barber', actorId: 'barber-1' });
    expect(repo.saved.at(-1)?.data?.status).toBe('no_show');
  });
});
