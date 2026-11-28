// Матриця «барбер × послуга» для партії (T-4521/T-044): батько і син стоять
// лише в барберів, які виконують послугу партії в цій локації. Тест іде через
// сам use-case, який викликає AppointmentPartyController, а не через фікстуру
// домену; HTTP-код перевіряється на маппері помилок контролера.
import { UnprocessableEntityException } from '@nestjs/common';
import { CreateAppointmentParty } from './create-appointment-party.use-case';
import {
  InMemoryAppointmentPartyRepository,
  baseInput,
  parallelInput,
  sequentialInput,
} from './create-appointment-party-test.fakes';
import { toPartyHttpError } from '../infrastructure/appointment-party-guards';
import type { BarberServiceMatrix } from '../../scheduling/domain/barber-service-matrix';

const matrix = (entries: Array<[string, string[]]>): BarberServiceMatrix =>
  new Map(
    entries.map(([barberId, serviceIds]) => [
      barberId,
      new Map([['location-1', new Set(serviceIds)]]),
    ])
  );

const matrixPort = (value: BarberServiceMatrix) => ({
  snapshotForLocation: async () => ({ matrix: value }),
});

describe('CreateAppointmentParty: матриця «барбер × послуга»', () => {
  it('parallel: обидва барбери виконують послугу → партія створена', async () => {
    const repo = new InMemoryAppointmentPartyRepository();
    const useCase = new CreateAppointmentParty(repo, {
      matrix: matrixPort(matrix([
        ['barber-1', ['father-son']],
        ['barber-2', ['father-son']],
      ]) as never),
    });

    const result = await useCase.execute(parallelInput());

    expect((await repo.findById(result.appointmentParty.id))?.mode).toBe('parallel');
  });

  it('parallel: барбер сина послугу не виконує → відмова, нічого не збережено', async () => {
    const repo = new InMemoryAppointmentPartyRepository();
    const useCase = new CreateAppointmentParty(repo, {
      matrix: matrixPort(matrix([
        ['barber-1', ['father-son']],
        ['barber-2', ['haircut']],
      ]) as never),
    });

    await expect(useCase.execute(parallelInput())).rejects.toThrow(
      /does not perform this service.*barber-2/
    );
    expect(repo.parties.size).toBe(0);
  });

  it('sequential: єдиний барбер послугу не виконує → відмова', async () => {
    const repo = new InMemoryAppointmentPartyRepository();
    const useCase = new CreateAppointmentParty(repo, {
      matrix: matrixPort(matrix([
        ['barber-1', ['haircut']],
        ['barber-2', ['father-son']],
      ]) as never),
    });

    await expect(useCase.execute(sequentialInput())).rejects.toThrow(/does not perform/);
    expect(repo.parties.size).toBe(0);
  });

  it('порожня матриця → дефолт «усі барбери», партія створена', async () => {
    const repo = new InMemoryAppointmentPartyRepository();
    const useCase = new CreateAppointmentParty(repo, { matrix: matrixPort(new Map()) as never });

    const result = await useCase.execute(parallelInput());

    expect(await repo.findById(result.appointmentParty.id)).not.toBeNull();
  });

  it('без порту матриці поведінка не змінюється', async () => {
    const repo = new InMemoryAppointmentPartyRepository();
    const useCase = new CreateAppointmentParty(repo);

    const result = await useCase.execute(parallelInput());

    expect(await repo.findById(result.appointmentParty.id)).not.toBeNull();
  });

  it('контролер віддає 422 на відмову матриці', () => {
    expect(() => toPartyHttpError(new Error('Barber does not perform this service (T-4521): b'))).toThrow(
      UnprocessableEntityException
    );
  });
});
