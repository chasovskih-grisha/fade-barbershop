// BookAgainIntentReader (T-4617a): за завершеним власним візитом віддає
// локацію, послугу, барбера і поточну ціну; позначає нечинні об'єкти stale;
// чужого/невідомого/незавершеного візиту не читає; нічого не створює.
import { AppointmentNotFoundError } from './appointment-lifecycle.use-case';
import { BookAgainIntentReader } from './book-again-intent';
import { prismaOf } from './book-again-intent.fakes';

const read = (prisma: ReturnType<typeof prismaOf>['prisma']) =>
  new BookAgainIntentReader(prisma as never).handle('apt-1', 'user-1');

describe('BookAgainIntentReader', () => {
  it('завершений свій візит повертає три ідентифікатори і поточну ціну', async () => {
    const intent = await read(prismaOf().prisma);

    expect(intent).toEqual({
      location: { id: 'loc-1', name: 'Поділ', stale: false },
      service: { id: 'svc-1', name: 'Стрижка', stale: false },
      barber: { id: 'barber-1', name: 'Олег', stale: false },
      price: 700,
    });
  });

  it('чужий або незавершений візит не повертає даних', async () => {
    const foreign = prismaOf({ booking: null });
    await expect(read(foreign.prisma)).rejects.toBeInstanceOf(AppointmentNotFoundError);

    const unfinished = prismaOf({
      booking: { ...{ barberId: 'b', locationId: 'l', serviceId: 's' }, status: 'booked' },
    });
    await expect(read(unfinished.prisma)).rejects.toBeInstanceOf(AppointmentNotFoundError);
  });

  it('нечинний барбер позначений, решта лишається', async () => {
    const intent = await read(
      prismaOf({
        assignment: null,
        barber: { id: 'barber-1', name: 'Олег', active: true, role: 'barber' },
      }).prisma
    );

    expect(intent.barber).toEqual({ id: 'barber-1', name: 'Олег', stale: true });
    expect(intent.location.stale).toBe(false);
    expect(intent.service?.stale).toBe(false);
  });

  it('послуга без ціни локації позначена нечинною, ціна порожня', async () => {
    const intent = await read(prismaOf({ price: null }).prisma);

    expect(intent.price).toBeNull();
    expect(intent.service).toEqual({ id: 'svc-1', name: 'Стрижка', stale: true });
  });

  it('неактивна локація позначена нечинною', async () => {
    const intent = await read(
      prismaOf({ location: { id: 'loc-1', name: 'Поділ', active: false } }).prisma
    );

    expect(intent.location).toEqual({ id: 'loc-1', name: 'Поділ', stale: true });
    expect(intent.service?.stale).toBe(false);
  });

  it('неактивна послуга позначена нечинною', async () => {
    const intent = await read(
      prismaOf({ service: { id: 'svc-1', name: 'Стрижка', active: false } }).prisma
    );

    expect(intent.service).toEqual({ id: 'svc-1', name: 'Стрижка', stale: true });
    expect(intent.location.stale).toBe(false);
  });

  it('виклик не створює рядка візиту', async () => {
    const { prisma, create } = prismaOf();
    await read(prisma);

    expect(create).not.toHaveBeenCalled();
  });
});
