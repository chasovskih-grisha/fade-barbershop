// Фабрика use-case провайдерів identity (deps-бандл у конструкторі).

import type { FactoryProvider, InjectionToken, OptionalFactoryDependency } from '@nestjs/common';

export type Deps = (InjectionToken | OptionalFactoryDependency)[];

/** Use case з deps-бандлом: конструктор приймає один об'єкт. */
export const useCase = <T>(
  Ctor: new (deps: never) => T,
  deps: Deps,
  pick: (d: never[]) => object
): FactoryProvider => ({
  provide: Ctor as unknown as InjectionToken,
  useFactory: (...args: never[]) => new Ctor(pick(args) as never),
  inject: deps,
});
