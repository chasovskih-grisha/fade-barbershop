import { GetLocationDetailsHandler } from './get-location-details';
import { LocationNotFoundError } from './locations-errors';
import { createLocation } from '../test-helpers.fakes';
import type { Location } from '../domain/location';

function inMemoryRepo(initial: Location[]) {
  let data = [...initial];
  return {
    async findById(id: string) {
      return data.find((l) => l.id === id) ?? null;
    },
    async findByCode(code: string) {
      const normalized = code.trim().toUpperCase();
      return data.find((l) => l.code === normalized) ?? null;
    },
    async save(location: Location) {
      data = data.map((l) => (l.id === location.id ? location : l));
    },
  };
}

describe('GetLocationDetailsHandler', () => {
  it('повертає активну локацію за кодом (нормалізуючи регістр і пробіли)', async () => {
    const repo = inMemoryRepo([createLocation({ id: 'loc-1', code: 'baumana' })]);
    const handler = new GetLocationDetailsHandler(repo as never);
    const result = await handler.handle('  BAUMANA ');
    expect(result.location.code).toBe('BAUMANA');
  });

  it('неактивна локація повертається з прапорцем inactive (явний стан, не 404)', async () => {
    const location = createLocation({ id: 'loc-1', code: 'podil' });
    location.setActive(false);
    const repo = inMemoryRepo([location]);
    const handler = new GetLocationDetailsHandler(repo as never);
    const result = await handler.handle('PODIL');
    expect(result.inactive).toBe(true);
    expect(result.location.active).toBe(false);
  });

  it('активна локація — inactive=false', async () => {
    const repo = inMemoryRepo([createLocation({ id: 'loc-1', code: 'baumana' })]);
    const handler = new GetLocationDetailsHandler(repo as never);
    const result = await handler.handle('BAUMANA');
    expect(result.inactive).toBe(false);
  });

  it('невідомий код → LocationNotFoundError', async () => {
    const handler = new GetLocationDetailsHandler(inMemoryRepo([]) as never);
    await expect(handler.handle('NOPE')).rejects.toBeInstanceOf(LocationNotFoundError);
  });
});
