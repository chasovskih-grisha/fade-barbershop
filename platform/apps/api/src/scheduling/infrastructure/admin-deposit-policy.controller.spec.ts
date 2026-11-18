// AdminDepositPolicyController (PAY-ADM-09, T-4444): GET віддає політику з
// версією, PUT інкрементує її лише на реальній зміні; історія — окремий GET.
import { AdminDepositPolicyController } from './admin-deposit-policy.controller';
import type { DepositPolicy } from '../domain/deposit-terms';

function stub(initial: DepositPolicy) {
  let current = { ...initial, version: 1 };
  return {
    controller: new AdminDepositPolicyController({
      getVersioned: async () => current,
      set: async (next: DepositPolicy) => {
        const changed =
          next.percent !== current.percent ||
          next.rounding !== current.rounding ||
          next.cancellationWindowHours !== current.cancellationWindowHours;
        if (changed) current = { ...next, version: current.version + 1 };
        return current;
      },
      history: async () => [current],
    } as never),
    saved: () => current,
  };
}

const DEFAULT: DepositPolicy = { percent: 30, rounding: 10, cancellationWindowHours: 4 };

describe('AdminDepositPolicyController', () => {
  it('GET віддає поточну політику з версією', async () => {
    const { controller } = stub(DEFAULT);
    await expect(controller.get()).resolves.toEqual({ ...DEFAULT, version: 1 });
  });

  it('PUT зберігає часткову зміну і повертає нову версію', async () => {
    const { controller, saved } = stub(DEFAULT);

    await expect(controller.update({ percent: 50 })).resolves.toEqual({
      percent: 50,
      rounding: 10,
      cancellationWindowHours: 4,
      version: 2,
    });
    expect(saved().version).toBe(2);
  });

  it('невалідні значення не переписують чинну політику', async () => {
    const { controller } = stub(DEFAULT);

    await expect(
      controller.update({ percent: 250, rounding: 3, cancellationWindowHours: -1 })
    ).resolves.toEqual({ ...DEFAULT, version: 1 });
  });

  it('0% вимикає депозит — це валідна зміна', async () => {
    const { controller } = stub(DEFAULT);

    await expect(controller.update({ percent: 0 })).resolves.toEqual({
      percent: 0,
      rounding: 10,
      cancellationWindowHours: 4,
      version: 2,
    });
  });

  it('порожнє тіло лишає правила без змін', async () => {
    const { controller } = stub(DEFAULT);

    await expect(controller.update(null)).resolves.toEqual({ ...DEFAULT, version: 1 });
  });

  it('history віддає збережені версії', async () => {
    const { controller } = stub(DEFAULT);

    await expect(controller.history()).resolves.toEqual([{ ...DEFAULT, version: 1 }]);
  });
});
