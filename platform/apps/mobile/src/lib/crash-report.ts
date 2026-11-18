// Мінімальний краш-коридор застосунку (T-4443): з помилки будується мінімальний
// звіт без PII і стабільний відбиток класу краху для алерту «новий клас» (T-4204).
// Домен без RN/Expo: контекст пристрою приходить ззовні, транспорт — порт. Сире
// повідомлення і стек не шлються взагалі — лише name і нормалізований відбиток.

export interface CrashContext {
  appVersion: string;
  platform: string;
  occurredAt: string;
}

export interface CrashReport extends CrashContext {
  /** Стабільний відбиток класу: name + нормалізоване повідомлення. */
  crashClass: string;
  name: string;
}

export interface CrashReporter {
  report(report: CrashReport): Promise<void>;
}

const MESSAGE_LIMIT = 160;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

/** Нормалізує повідомлення: без переносів, пошта → <email>, цифри → #, обрізає. */
export function normalizeMessage(message: string): string {
  return message
    .replace(EMAIL, '<email>')
    .replace(/\s+/g, ' ')
    .replace(/\d+/g, '#')
    .trim()
    .slice(0, MESSAGE_LIMIT);
}

/** Відбиток класу краху: `Name: нормалізоване повідомлення`. */
export function crashClassOf(error: { name?: string; message?: string }): string {
  const name = (error.name ?? 'Error').trim() || 'Error';
  return `${name}: ${normalizeMessage(error.message ?? '')}`;
}

/** Мінімальний звіт: клас, name, контекст. Без повідомлення, без стека. */
export function buildCrashReport(
  error: { name?: string; message?: string },
  context: CrashContext
): CrashReport {
  return {
    crashClass: crashClassOf(error),
    name: (error.name ?? 'Error').trim() || 'Error',
    ...context,
  };
}

/** HTTP-репортер маяка; збій мережі ковтається — краш-коридор не має ламати застосунок. */
export function createHttpCrashReporter(options: {
  endpoint: string;
  fetchImpl: typeof fetch;
}): CrashReporter {
  return {
    async report(report: CrashReport): Promise<void> {
      try {
        await options.fetchImpl(options.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });
      } catch {
        // Маяк — не критичний шлях: помилка доставки не кидається далі.
      }
    },
  };
}
