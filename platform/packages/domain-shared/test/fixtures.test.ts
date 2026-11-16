import { DatabaseSeederEngine, SHOPS_FIXTURE, BARBERS_FIXTURE } from '../src/fixtures/master';

describe('Master Database Seeder & Fixtures', () => {
  it('should initialize seeder engine with default robust dataset', () => {
    const seeder = new DatabaseSeederEngine();
    const summary = seeder.generateSummary();

    expect(summary.shopsCount).toBeGreaterThanOrEqual(4);
    expect(summary.barbersCount).toBeGreaterThanOrEqual(8);
    expect(summary.clientsCount).toBeGreaterThanOrEqual(8);
    expect(summary.servicesCount).toBeGreaterThanOrEqual(9);
    expect(summary.inventoryCount).toBeGreaterThanOrEqual(6);
    expect(summary.promoCodesCount).toBeGreaterThanOrEqual(3);
    expect(summary.appointmentsCount).toBeGreaterThanOrEqual(7);
    expect(summary.reviewsCount).toBeGreaterThanOrEqual(3);
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
          phone: '+1-555-9999',
          email: 'custom@apexbarbers.com',
          coordinates: { lat: 34.0522, lng: -118.2437 },
          amenities: ['Wi-Fi'],
        },
      ],
      barbers: [],
      clients: [],
      appointments: [],
      reviews: [],
      inventory: [],
      promoCodes: [],
    });

    const summary = customSeeder.generateSummary();
    expect(summary.shopsCount).toBe(1);
    expect(summary.barbersCount).toBe(0);
    expect(customSeeder.validateReferentialIntegrity().isValid).toBe(true);
  });
});
