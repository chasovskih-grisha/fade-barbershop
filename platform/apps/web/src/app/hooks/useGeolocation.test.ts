// useGeolocation — стани запиту геолокації (мок navigator.geolocation).

import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

const coords = { latitude: 50.45, longitude: 30.52 };

function mockGeolocation() {
  const getCurrentPosition = jest.fn();
  (navigator as unknown as { geolocation: unknown }).geolocation = { getCurrentPosition };
  return getCurrentPosition;
}

describe('useGeolocation', () => {
  it('без navigator.geolocation — статус unsupported', () => {
    (navigator as unknown as { geolocation?: unknown }).geolocation = undefined;
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.request());
    expect(result.current.status).toBe('unsupported');
    expect(result.current.coords).toBeNull();
  });

  it('успіх — координати + granted', () => {
    const getCurrentPosition = mockGeolocation();
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.request());
    expect(result.current.status).toBe('locating');
    act(() => getCurrentPosition.mock.calls[0][0]({ coords }));
    expect(result.current.status).toBe('granted');
    expect(result.current.coords).toEqual({ lat: coords.latitude, lng: coords.longitude });
  });

  it('відмова користувача — статус denied', () => {
    const getCurrentPosition = mockGeolocation();
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.request());
    act(() => getCurrentPosition.mock.calls[0][1]({ code: 1 }));
    expect(result.current.status).toBe('denied');
  });

  it('reset скидає до idle', () => {
    const getCurrentPosition = mockGeolocation();
    const { result } = renderHook(() => useGeolocation());
    act(() => result.current.request());
    act(() => getCurrentPosition.mock.calls[0][0]({ coords }));
    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(result.current.coords).toBeNull();
  });
});
