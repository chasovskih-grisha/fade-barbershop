// Позначка поля/класу, чий вміст є Idempotency-Key запиту (T-4207).
// Сам ключ передається заголовком; декоратор лише фіксує, яке поле DTO
// дублює його в тілі, щоб інтерсептор міг звірити значення.
import 'reflect-metadata';

export const IDEMPOTENCY_KEY_METADATA = 'fade:idempotency-key';

type DecoratorTarget = object | (new (...args: never[]) => unknown);

function mark(target: DecoratorTarget, propertyKey?: string | symbol): void {
  const holder = typeof target === 'function' ? target : (target as object).constructor;
  const keys: Array<string | symbol> =
    (Reflect.getMetadata(IDEMPOTENCY_KEY_METADATA, holder) as Array<string | symbol> | undefined) ??
    [];
  const key = propertyKey ?? 'class';
  if (!keys.includes(key)) keys.push(key);
  Reflect.defineMetadata(IDEMPOTENCY_KEY_METADATA, keys, holder);
}

/** Працює і на класі DTO, і на окремому полі. */
export function IdempotencyKey(): ClassDecorator & PropertyDecorator {
  return ((target: DecoratorTarget, propertyKey?: string | symbol) => {
    mark(target, propertyKey);
  }) as ClassDecorator & PropertyDecorator;
}

/** Які поля DTO позначені як джерело Idempotency-Key. */
export function idempotencyKeyFields(target: object): Array<string | symbol> {
  const holder = typeof target === 'function' ? target : target.constructor;
  return (
    (Reflect.getMetadata(IDEMPOTENCY_KEY_METADATA, holder) as Array<string | symbol> | undefined) ??
    []
  );
}
