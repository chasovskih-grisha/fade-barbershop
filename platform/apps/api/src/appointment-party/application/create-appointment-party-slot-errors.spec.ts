import { CreateAppointmentParty } from './create-appointment-party.use-case';
import {
  InMemoryAppointmentPartyRepository,
  parallelInput,
  sequentialInput,
} from './create-appointment-party-test.fakes';

describe('CreateAppointmentParty slot error branches', () => {
  const repo = new InMemoryAppointmentPartyRepository();
  const useCase = new CreateAppointmentParty(repo);
  const seq = sequentialInput;
  const par = parallelInput;

  it('rejects sequential mode with zero slots', async () => {
    await expect(useCase.execute({ ...seq(), slots: [] })).rejects.toThrow(
      'Sequential mode requires exactly one slot'
    );
  });

  it('rejects parallel mode with the wrong slot count', async () => {
    await expect(useCase.execute({ ...par(), slots: par().slots.slice(0, 1) })).rejects.toThrow(
      'Parallel mode requires exactly two slots'
    );
  });

  it('rejects parallel slots that do not share a start', async () => {
    await expect(
      useCase.execute({
        ...par(),
        slots: [
          { start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T09:50:00Z') },
          { start: new Date('2026-10-01T09:30:00Z'), end: new Date('2026-10-01T10:15:00Z') },
        ],
      })
    ).rejects.toThrow('Parallel slots must share the same start time');
  });

  it('rejects parallel slots with the wrong durations', async () => {
    await expect(
      useCase.execute({
        ...par(),
        slots: [
          { start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T09:30:00Z') },
          { start: new Date('2026-10-01T09:00:00Z'), end: new Date('2026-10-01T09:45:00Z') },
        ],
      })
    ).rejects.toThrow('50 minutes for father');
  });
});
