// T-4619a: тік sweeper-а запускається за розписом, переживає помилку проходу
// і зупиняється без подальших викликів.
import { DepositHoldSweeper } from './deposit-hold-sweeper.worker';
import type { DepositHoldService } from '../application/deposit-hold.service';

function make(sweep = jest.fn().mockResolvedValue([])) {
  const worker = new DepositHoldSweeper({ sweep } as unknown as DepositHoldService);
  return { worker, sweep };
}

describe('DepositHoldSweeper (T-4619a)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('runs the sweep on every tick', async () => {
    const { worker, sweep } = make();

    worker.start(1000);
    await jest.advanceTimersByTimeAsync(2500);

    expect(sweep).toHaveBeenCalledTimes(2);
    worker.stop();
  });

  it('keeps ticking after a failed pass', async () => {
    const sweep = jest.fn().mockRejectedValueOnce(new Error('db down')).mockResolvedValueOnce([]);
    const { worker } = make(sweep);

    worker.start(1000);
    await jest.advanceTimersByTimeAsync(2500);

    expect(sweep).toHaveBeenCalledTimes(2);
    worker.stop();
  });

  it('does not schedule a non-positive or disabled interval', async () => {
    const { worker, sweep } = make();

    worker.start(0);
    worker.start(-5);
    await jest.advanceTimersByTimeAsync(10_000);

    expect(sweep).not.toHaveBeenCalled();
    worker.stop();
  });
});
