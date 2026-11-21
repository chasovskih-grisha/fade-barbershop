import { AppointmentMode } from '../domain/appointment-party.entity';
import { CreateAppointmentParty } from './create-appointment-party.use-case';
import {
  InMemoryAppointmentPartyRepository,
  parallelInput,
  sequentialInput,
} from './create-appointment-party-test.fakes';

describe('CreateAppointmentParty error branches', () => {
  const repo = new InMemoryAppointmentPartyRepository();
  const useCase = new CreateAppointmentParty(repo);
  const seq = sequentialInput;
  const par = parallelInput;

  it('rejects missing location or service', async () => {
    await expect(useCase.execute({ ...seq(), locationId: '  ' })).rejects.toThrow(
      'Location and service are required'
    );
    await expect(useCase.execute({ ...seq(), serviceId: '  ' })).rejects.toThrow(
      'Location and service are required'
    );
  });

  it('rejects a non-positive or non-integer agreed price', async () => {
    await expect(useCase.execute({ ...seq(), agreedPrice: 0 })).rejects.toThrow(
      'Agreed price must be a positive integer'
    );
    await expect(useCase.execute({ ...seq(), agreedPrice: 10.5 })).rejects.toThrow(
      'Agreed price must be a positive integer'
    );
  });

  it('rejects missing barber ids', async () => {
    await expect(
      useCase.execute({ ...seq(), barberIds: ['', ''] as [string, string] })
    ).rejects.toThrow('Barber IDs are required');
  });

  it('rejects a party without exactly two legs', async () => {
    await expect(
      useCase.execute({ ...seq(), partyLegs: seq().partyLegs.slice(0, 1) })
    ).rejects.toThrow('Exactly two party legs are required');
  });

  it('rejects legs not ordered father then son', async () => {
    await expect(
      useCase.execute({ ...seq(), partyLegs: [...seq().partyLegs].reverse() })
    ).rejects.toThrow('Party legs must be ordered father then son');
  });

  it('rejects legs that do not match the barber assignment', async () => {
    await expect(
      useCase.execute({
        ...par(),
        partyLegs: [
          { id: 'leg-1', role: 'father' as const, name: 'Father', age: 40, barberId: 'barber-1' },
          { id: 'leg-2', role: 'son' as const, name: 'Son', age: 10, barberId: 'barber-1' },
        ],
      })
    ).rejects.toThrow('Party legs must match the barber assignment');
  });

  it('rejects an unknown appointment mode', async () => {
    await expect(useCase.execute({ ...seq(), mode: 'unknown' as AppointmentMode })).rejects.toThrow(
      'Invalid appointment mode'
    );
  });
});
