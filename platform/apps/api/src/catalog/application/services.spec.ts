import { InvalidServiceInputError, ServiceCodeTakenError, ServiceNotFoundError } from './services-errors';
import { setupServices } from './services.spec.setup';

describe('Services vertical slice (T-066)', () => {
  it('create persists service metadata without a global price', async () => {
    const { create, services } = setupServices();
    const { id } = await create.handle({
      name: 'Haircut',
      duration: 30,
      category: 'Hair',
      description: 'Classic cut',
    });
    await expect(services.findById(id)).resolves.toMatchObject({
      props: { name: 'Haircut', duration: 30, category: 'Hair', description: 'Classic cut' },
    });
  });

  it('keeps the optional parallel fulfillment duration on the same service SKU', async () => {
    const { create, services } = setupServices();
    const { id } = await create.handle({
      name: 'Father + son',
      duration: 90,
      parallelDuration: 50,
    });
    await expect(services.findById(id)).resolves.toMatchObject({
      props: { duration: 90, parallelDuration: 50 },
    });
  });

  it('duplicate name+duration rejects with ServiceCodeTakenError', async () => {
    const { create } = setupServices();
    await create.handle({ name: 'Haircut', duration: 30 });
    await expect(create.handle({ name: 'Haircut', duration: 30 })).rejects.toBeInstanceOf(
      ServiceCodeTakenError
    );
  });

  it('out-of-range duration rejects with InvalidServiceInputError', async () => {
    const { create } = setupServices();
    await expect(create.handle({ name: 'Haircut', duration: 2 })).rejects.toBeInstanceOf(
      InvalidServiceInputError
    );
  });

  it('blank name rejects with InvalidServiceInputError', async () => {
    const { create } = setupServices();
    await expect(create.handle({ name: '   ', duration: 30 })).rejects.toBeInstanceOf(
      InvalidServiceInputError
    );
  });

  it('update changes service description and category', async () => {
    const { create, update, services } = setupServices();
    const { id } = await create.handle({ name: 'Haircut', duration: 30 });
    await update.handle({ id, description: 'Updated', category: 'Hair' });
    await expect(services.findById(id)).resolves.toMatchObject({
      props: { description: 'Updated', category: 'Hair' },
    });
  });

  it('update of unknown id rejects with ServiceNotFoundError', async () => {
    const { update } = setupServices();
    await expect(update.handle({ id: 'nope', description: 'Updated' })).rejects.toBeInstanceOf(
      ServiceNotFoundError
    );
  });

  it('deactivating hides from listActive but keeps it in list', async () => {
    const { create, setActive, list } = setupServices();
    const { id } = await create.handle({ name: 'Haircut', duration: 30 });
    await setActive.handle(id, false);
    await expect(list.listActive()).resolves.toHaveLength(0);
    await expect(list.list()).resolves.toHaveLength(1);
  });
});
