// Групи поведінки CreateAppointmentParty: валідний ввід — baseInput (fakes),
// сюїти спрощуються до override-ів поверх нього (DRY з create-appointment-party-test.fakes).
import { AppointmentPartyCreated } from '../domain/appointment-party.events';
import { CreateAppointmentParty } from './create-appointment-party.use-case';
import {
  InMemoryAppointmentPartyRepository,
  baseInput,
  sequentialInput,
  parallelInput,
} from './create-appointment-party-test.fakes';

describe('CreateAppointmentParty: створення party', () => {
  const repo = new InMemoryAppointmentPartyRepository();
  const useCase = new CreateAppointmentParty(repo);

  it('sequential: 90-хвилинний слот, подія AppointmentPartyCreated', async () => {
    const result = await useCase.execute({
      ...baseInput(),
      mode: 'sequential',
      slots: [{ start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T10:30:00Z') }],
    });

    expect(result).toBeInstanceOf(AppointmentPartyCreated);
    const stored = await repo.findById(result.appointmentParty.id);
    expect(stored?.mode).toBe('sequential');
    expect(stored?.slots).toHaveLength(1);
    expect(stored?.slots[0]?.durationMinutes).toBe(90);
  });

  it('parallel: два слоти зі спільним стартом і різними барберами', async () => {
    const result = await useCase.execute({
      ...baseInput(),
      mode: 'parallel',
      barberIds: ['barber-1', 'barber-2'] as [string, string],
      partyLegs: [
        { id: 'leg-1', role: 'father' as const, name: 'Father', age: 40, barberId: 'barber-1' },
        { id: 'leg-2', role: 'son' as const, name: 'Son', age: 10, barberId: 'barber-2' },
      ],
      slots: [
        { start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T09:50:00Z') },
        { start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T09:45:00Z') },
      ],
    });

    expect(result).toBeInstanceOf(AppointmentPartyCreated);
    const stored = await repo.findById(result.appointmentParty.id);
    expect(stored?.mode).toBe('parallel');
    expect(stored?.slots.map((s) => s.durationMinutes)).toEqual([50, 45]);
    expect(stored?.slots[0]?.start.getTime()).toBe(stored?.slots[1]?.start.getTime());
  });
});

describe('CreateAppointmentParty: барбери і слоти за режимом', () => {
  const repo = new InMemoryAppointmentPartyRepository();
  const useCase = new CreateAppointmentParty(repo);

  it('sequential: один барбер обслуговує обидві ноги', async () => {
    const result = await useCase.execute({
      ...baseInput(),
      mode: 'sequential',
      slots: [{ start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T10:30:00Z') }],
    });

    expect(result.appointmentParty.barberIds).toEqual(['barber-1', 'barber-1']);
  });

  it('parallel з тим самим барбером двічі — відхилено', async () => {
    await expect(
      useCase.execute({
        ...parallelInput(),
        barberIds: ['barber-1', 'barber-1'] as [string, string],
      })
    ).rejects.toThrow('Parallel mode requires two distinct barbers');
  });

  it('sequential з двома різними барберами — відхилено', async () => {
    await expect(
      useCase.execute({
        ...sequentialInput(),
        barberIds: ['barber-1', 'barber-2'] as [string, string],
      })
    ).rejects.toThrow('Sequential mode requires one barber');
  });

  it('sequential: слот не 90 хвилин — відхилено', async () => {
    await expect(
      useCase.execute({
        ...sequentialInput(),
        slots: [{ start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T10:00:00Z') }],
      })
    ).rejects.toThrow('Sequential slot must be 90 minutes');
  });
});
