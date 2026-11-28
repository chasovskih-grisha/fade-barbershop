// T-4429: екранний шар кешу — реальні `loadStartupSection`/`memoryStorage`,
// підмінені лише мережеві фетчери (fake-порт, як FakeOtpSender).
import { renderHook, waitFor } from '@testing-library/react-native';
import { useStartupData } from './use-startup-data';
import { memoryStorage } from './cache-storage';
import { writeCache } from './offline-cache';
import { startupKey } from './startup-data';
import * as locationsApi from './api/locations';
import * as catalogApi from './api/catalog';

jest.mock('./api/locations', () => ({ fetchLocations: jest.fn() }));
jest.mock('./api/catalog', () => ({ fetchServices: jest.fn() }));

const locations = locationsApi.fetchLocations as jest.Mock;
const services = catalogApi.fetchServices as jest.Mock;

describe('useStartupData (T-4429)', () => {
  beforeEach(() => {
    locations.mockReset();
    services.mockReset();
  });

  it('перший старт тягне мережу один раз і показує свіже', async () => {
    locations.mockResolvedValue([{ id: 'l1' }]);
    services.mockResolvedValue([{ id: 's1' }]);

    const { result } = renderHook(() => useStartupData(memoryStorage()));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stale).toBe(false);
    expect(result.current.locations.data).toEqual([{ id: 'l1' }]);
    expect(locations).toHaveBeenCalledTimes(1);
  });

  it('офлайн зі свіжим кешем: дані без мережі', async () => {
    const storage = memoryStorage();
    await writeCache({ storage, key: startupKey('locations'), now: Date.now() }, [
      { id: 'cached-l' },
    ]);
    await writeCache({ storage, key: startupKey('services'), now: Date.now() }, [
      { id: 'cached-s' },
    ]);
    locations.mockRejectedValue(new Error('offline'));
    services.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useStartupData(storage));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stale).toBe(false);
    expect(result.current.locations.data).toEqual([{ id: 'cached-l' }]);
    expect(locations).not.toHaveBeenCalled();
  });

  it('офлайн із застарілим кешем: дані з банером «застарілі»', async () => {
    const storage = memoryStorage();
    const old = Date.now() - 60 * 60 * 1000;
    await writeCache({ storage, key: startupKey('locations'), now: old }, [{ id: 'old-l' }]);
    await writeCache({ storage, key: startupKey('services'), now: old }, [{ id: 'old-s' }]);
    locations.mockRejectedValue(new Error('offline'));
    services.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useStartupData(storage));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stale).toBe(true);
    expect(result.current.locations.data).toEqual([{ id: 'old-l' }]);
  });

  it('офлайн без кешу: порожній стан без баннера', async () => {
    locations.mockRejectedValue(new Error('offline'));
    services.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useStartupData(memoryStorage()));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stale).toBe(false);
    expect(result.current.locations.data).toEqual([]);
  });
});
