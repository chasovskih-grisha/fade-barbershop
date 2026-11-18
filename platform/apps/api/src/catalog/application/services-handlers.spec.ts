import { InvalidServiceInputError, ServiceNotFoundError } from './services-errors';
import { setupServices } from './services.spec.setup';

describe('Services handlers (coverage branches)', () => {
  it('list-services findById throws on unknown id', async () => {
    const { list } = setupServices();
    await expect(list.findById('nope')).rejects.toThrow('ServiceNotFound');
  });

  it('list-services returns the active catalog through findById', async () => {
    const { create, list } = setupServices();
    const { id } = await create.handle({ name: 'Shave', duration: 20 });
    await expect(list.findById(id)).resolves.toMatchObject({ props: { name: 'Shave' } });
  });

  it('set-service-active rejects an unknown service', async () => {
    const { setActive } = setupServices();
    await expect(setActive.handle('nope', true)).rejects.toBeInstanceOf(ServiceNotFoundError);
  });

  it('update rejects invalid name, duration, parallelDuration', async () => {
    const { create, update } = setupServices();
    const { id } = await create.handle({ name: 'Haircut', duration: 30 });
    await expect(update.handle({ id, name: '  ' })).rejects.toBeInstanceOf(
      InvalidServiceInputError
    );
    await expect(update.handle({ id, duration: 1 })).rejects.toBeInstanceOf(
      InvalidServiceInputError
    );
    await expect(update.handle({ id, parallelDuration: 1000 })).rejects.toBeInstanceOf(
      InvalidServiceInputError
    );
  });

  it('update applies name/duration/sortOrder and clears optional fields to null', async () => {
    const { create, update, services } = setupServices();
    const { id } = await create.handle({ name: 'Haircut', duration: 30, category: 'Hair' });
    await update.handle({
      id,
      name: 'Buzz',
      duration: 15,
      sortOrder: 2,
      parallelDuration: null,
      description: '',
      category: '',
    });
    await expect(services.findById(id)).resolves.toMatchObject({
      props: {
        name: 'Buzz',
        duration: 15,
        sortOrder: 2,
        parallelDuration: null,
        description: null,
        category: null,
      },
    });
  });
});
