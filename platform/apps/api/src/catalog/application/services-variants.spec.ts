import { InvalidServiceInputError } from './services-errors';
import { setupServices } from './services.spec.setup';

// T-4419 S1: варіанти тривалості живуть на послузі, а не лише в домені.
// Послуга без варіантів лишається стандартом (T-041 не регресує).

describe('Duration variants on a service (T-4419 S1)', () => {
  it('stores duration variants on the service (T-4419 S1)', async () => {
    const { create, services } = setupServices();
    const { id } = await create.handle({
      name: 'Haircut',
      duration: 45,
      variants: [
        { label: 'short', duration: 30, parallelDuration: 25, priceDelta: 0, description: null },
        {
          label: 'long',
          duration: 60,
          parallelDuration: 50,
          priceDelta: 150,
          description: 'Стрижка + борода',
        },
      ],
    });

    const saved = await services.findById(id);
    expect(saved?.variants?.map((variant) => variant.label)).toEqual(['short', 'long']);
    expect(saved?.duration).toBe(45);
  });

  it('rejects an invalid variant without saving the service (T-4419 S1)', async () => {
    const { create, services } = setupServices();
    await expect(
      create.handle({
        name: 'Shave',
        duration: 30,
        variants: [
          { label: '  ', duration: 30, parallelDuration: null, priceDelta: 0, description: null },
        ],
      })
    ).rejects.toBeInstanceOf(InvalidServiceInputError);
    expect((await services.list()).map((service) => service.name)).toEqual([]);
  });

  it('a service without variants keeps the standard duration (T-4419 back-compat)', async () => {
    const { create, services } = setupServices();
    const { id } = await create.handle({ name: 'Beard', duration: 30 });
    const saved = await services.findById(id);
    expect(saved?.variants).toBeNull();
    expect(saved?.duration).toBe(30);
  });
});
