import { ListServicesHandler } from './list-services';
import { FakeServicesRepository } from './services.fakes';
import { Service } from '../domain/service';

function service(opts: { id: string; name: string; sortOrder: number; active?: boolean }): Service {
  const { id, name, sortOrder, active = true } = opts;
  return Service.create({
    id,
    name,
    duration: 30,
    parallelDuration: null,
    description: null,
    category: null,
    slug: null,
    seoDescription: null,
    faq: null,
    active,
    sortOrder,
  });
}

describe('Public catalog listActive() contract (fade.com.ua, ASCII byte-safe)', () => {
  it('listActive() returns ONLY active services', async () => {
    const services = new FakeServicesRepository();
    await services.save(service({ id: 's-1', name: 'Pomade', sortOrder: 0, active: true }));
    await services.save(service({ id: 's-2', name: 'Owner2026', sortOrder: 1, active: false }));
    const handler = new ListServicesHandler(services);
    const active = await handler.listActive();
    expect(active).toHaveLength(1);
    expect(active.map((s) => s.name)).toEqual(['Pomade']);
  });

  it('listActive() sorts by sortOrder then name', async () => {
    const services = new FakeServicesRepository();
    await services.save(service({ id: 's-1', name: 'Beard', sortOrder: 2 }));
    await services.save(service({ id: 's-2', name: 'Fade', sortOrder: 1 }));
    const handler = new ListServicesHandler(services);
    expect((await handler.listActive()).map((s) => s.name)).toEqual(['Fade', 'Beard']);
  });

  it('listActive() on empty repo is []', async () => {
    const services = new FakeServicesRepository();
    const handler = new ListServicesHandler(services);
    await expect(handler.listActive()).resolves.toEqual([]);
  });
});
