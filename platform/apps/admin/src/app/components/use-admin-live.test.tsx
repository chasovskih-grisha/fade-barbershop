// Хук живого оновлення (T-045): одна підписка на /admin/live/events, найсвіжіший
// callback без повторного підключення, закриття потоку на unmount, безпека в SSR.
import { act, renderHook } from '@testing-library/react';
import { FakeEventSource, installFakeEventSource } from './fake-event-source';
import { useAdminLive } from './use-admin-live';

describe('useAdminLive', () => {
  beforeEach(() => {
    FakeEventSource.reset();
    installFakeEventSource();
  });

  it('підписується на потік і викликає callback на подію appointment', () => {
    const onEvent = jest.fn();
    renderHook(() => useAdminLive(onEvent));

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.only().url).toBe('/admin/live/events');

    act(() => FakeEventSource.only().emit('appointment'));
    expect(onEvent).toHaveBeenCalledTimes(1);
  });

  it('не перепідписується, але кличе найсвіжіший callback', () => {
    const first = jest.fn();
    const { rerender } = renderHook(({ cb }) => useAdminLive(cb), {
      initialProps: { cb: first },
    });
    const second = jest.fn();

    rerender({ cb: second });
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => FakeEventSource.only().emit('appointment'));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('закриває потік на unmount', () => {
    const { unmount } = renderHook(() => useAdminLive(jest.fn()));
    unmount();

    expect(FakeEventSource.only().closed).toBe(true);
  });

  it('без EventSource (SSR) не падає й не підписується', () => {
    delete (globalThis as { EventSource?: unknown }).EventSource;

    expect(() => renderHook(() => useAdminLive(jest.fn()))).not.toThrow();
    expect(FakeEventSource.instances).toHaveLength(0);
  });
});
