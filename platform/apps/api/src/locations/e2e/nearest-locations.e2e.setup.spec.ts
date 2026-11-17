import { InMemoryLocationRepository, MemGeocoder, PODIL } from './nearest-locations.e2e.setup';

describe('nearest-locations e2e setup helpers', () => {
  describe('MemGeocoder', () => {
    it('recognizes a point inside a city box', async () => {
      await expect(new MemGeocoder().reverseGeocode(50.5, 30.5)).resolves.toEqual({ city: 'Київ' });
    });

    it('returns null outside any city box', async () => {
      await expect(new MemGeocoder().reverseGeocode(50.0, 30.0)).resolves.toBeNull();
    });
  });

  describe('InMemoryLocationRepository', () => {
    it('saves and reads a location', async () => {
      const repo = new InMemoryLocationRepository();
      await repo.save(PODIL);
      expect((await repo.list()).map((l) => l.id)).toEqual(['loc-podil']);
      expect(await repo.findById(PODIL.id)).toBe(PODIL);
      expect(await repo.findByCode(PODIL.code)).toBe(PODIL);
    });

    it('lists only active locations', async () => {
      const repo = new InMemoryLocationRepository();
      await repo.save(PODIL);
      expect((await repo.listActive()).map((l) => l.id)).toEqual(['loc-podil']);
    });

    it('returns null for unknown id or code', async () => {
      const repo = new InMemoryLocationRepository();
      expect(await repo.findById('unknown')).toBeNull();
      expect(await repo.findByCode('unknown')).toBeNull();
    });
  });
});
