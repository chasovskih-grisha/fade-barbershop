import { DatabaseSeederEngine, SHOPS_FIXTURE, BARBERS_FIXTURE } from '../src/fixtures/master';

describe('Master Database Seeder & Fixtures', () => {
  it('should initialize seeder engine with default robust dataset', () => {
    const seeder = new DatabaseSeederEngine();
    const summary = seeder.generateSummary();

    expect(summary.shopsCount).toBeGreaterThanOrEqual(3);
    expect(summary.barbersCount).toBeGreaterThanOrEqual(6);
    expect(summary.clientsCount).toBeGreaterThanOrEqual(5);
    expect(summary.servicesCount).toBeGreaterThanOrEqual(7);
    expect(summary.inventoryCount).toBeGreaterThanOrEqual(4);
  });

  it('should maintain strict referential integrity across all entities', () => {
    const seeder = new DatabaseSeederEngine();
    const integrity = seeder.validateReferentialIntegrity();

    if (!integrity.isValid) {
      console.error('Integrity Errors:', integrity.errors);
    }
    expect(integrity.isValid).toBe(true);
    expect(integrity.errors).toHaveLength(0);
  });

  it('should support deterministic custom dataset overrides', () => {
    const customSeeder = new DatabaseSeederEngine({
      locations: [
        {
          id: 'shop-custom-01',
          name: 'Custom Test Shop',
          code: 'CUST01',
          address: '1 Main St',
          city: 'Testville',
          state: 'CA',
          postalCode: '90210',
          timezone: 'America/Los_Angeles',
          status: 'ACTIVE',
          chairCount: 2,
          operatingHours: [],
        },
      ],
      barbers: [],
      clients: [],
      appointments: [],
      reviews: [],
      inventory: [],
    });

    const summary = customSeeder.generateSummary();
    expect(summary.shopsCount).toBe(1);
    expect(summary.barbersCount).toBe(0);
    expect(customSeeder.validateReferentialIntegrity().isValid).toBe(true);
  });
});
