// Тестовий двійник EventSource (T-045): jsdom його не має, а нам потрібно
// перевірити підписку, реакцію на подію та закриття потоку на unmount.
export class FakeEventSource {
  static instances: FakeEventSource[] = [];
  private readonly listeners = new Map<string, Array<() => void>>();
  closed = false;

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }

  static reset(): void {
    FakeEventSource.instances = [];
  }

  /** Єдиний створений потік — для тестів, де підписка одна. */
  static only(): FakeEventSource {
    const first = FakeEventSource.instances[0];
    if (!first) throw new Error('EventSource не створено');
    return first;
  }

  addEventListener(type: string, listener: () => void): void {
    const bucket = this.listeners.get(type) ?? [];
    bucket.push(listener);
    this.listeners.set(type, bucket);
  }

  close(): void {
    this.closed = true;
  }

  /** Тест «надсилає» подію всім підписаним слухачам. */
  emit(type = 'appointment'): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

/** Ставить двійника в global, звідки його бере хук. */
export function installFakeEventSource(): void {
  (globalThis as unknown as { EventSource: typeof FakeEventSource }).EventSource = FakeEventSource;
}
