import { Service, type ServiceProps } from './service';

function props(overrides: Partial<ServiceProps> = {}): ServiceProps {
  return {
    id: 'svc-1',
    name: 'Haircut',
    duration: 30,
    parallelDuration: null,
    description: 'Classic cut',
    category: 'Hair',
    slug: null,
    seoDescription: null,
    faq: null,
    active: true,
    sortOrder: 1,
    createdAt: new Date('2026-09-20T10:00:00Z'),
    updatedAt: new Date('2026-09-20T10:00:00Z'),
    ...overrides,
  };
}

describe('Service aggregate', () => {
  it('restore returns an instance preserving all props', () => {
    const service = Service.restore(props());
    expect(service.id).toBe('svc-1');
    expect(service.name).toBe('Haircut');
    expect(service.duration).toBe(30);
    expect(service.parallelDuration).toBeNull();
    expect(service.active).toBe(true);
    expect(service.sortOrder).toBe(1);
  });

  it('create stamps fresh createdAt/updatedAt', () => {
    const service = Service.create(props({ id: 'n1' }));
    expect(service.id).toBe('n1');
    expect(service.propsData.createdAt.getTime()).toBeGreaterThan(0);
    expect(service.propsData.updatedAt.getTime()).toBeGreaterThan(0);
  });

  it('exposes a shallow-copied snapshot of the props', () => {
    const service = Service.restore(props());
    const snapshot = service.propsSnapshot;
    expect(snapshot).toEqual(props());
    expect(snapshot).not.toBe(service.propsData);
    snapshot.name = 'Mutated';
    expect(service.name).toBe('Haircut');
  });

  it('toProps returns the prop data', () => {
    const service = Service.restore(props());
    expect(Service.toProps(service)).toEqual(props());
  });

  it('setActive mutates the active flag and setSortOrder the order', () => {
    const service = Service.restore(props());
    service.setActive(false);
    expect(service.active).toBe(false);
    service.setSortOrder(7);
    expect(service.sortOrder).toBe(7);
  });

  it('update applies the provided changes and bumps updatedAt', () => {
    const service = Service.restore(props());
    const before = service.propsData.updatedAt.getTime();
    service.update({
      name: 'Beard trim',
      duration: 45,
      parallelDuration: 25,
      description: 'Trimmed',
      category: 'Beard',
      sortOrder: 3,
    });
    const after = service.propsData;
    expect(after).toMatchObject({
      name: 'Beard trim',
      duration: 45,
      parallelDuration: 25,
      description: 'Trimmed',
      category: 'Beard',
      sortOrder: 3,
    });
    expect(after.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('update with an empty changes object keeps props and refreshes updatedAt', () => {
    const service = Service.restore(props());
    service.update({});
    expect(service.propsData).toMatchObject({ ...props(), updatedAt: service.propsData.updatedAt });
  });
});
