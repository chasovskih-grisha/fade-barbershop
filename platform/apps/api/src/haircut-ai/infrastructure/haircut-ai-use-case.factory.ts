// Фабрика Nest-провайдерів use case з deps-бандлом (окремо від списку
// провайдерів — гейт max-lines).

import type { FactoryProvider, InjectionToken, OptionalFactoryDependency } from '@nestjs/common';

export type Deps = (InjectionToken | OptionalFactoryDependency)[];

/** Use case з deps-бандлом: конструктор приймає один об'єкт, тож інжектимо
 *  concrete-адаптери й складаємо бандл у фабриці. */
export const useCase = <T>(
  Ctor: new (deps: never) => T,
  deps: Deps,
  pick: (d: Deps) => object
): FactoryProvider => ({
  provide: Ctor as unknown as InjectionToken,
  useFactory: (...args: Deps) => new Ctor(pick(args) as never),
  inject: deps,
});
