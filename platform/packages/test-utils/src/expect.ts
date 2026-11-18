// Expect-хелпери для специфікацій: чіткі повідомлення, які читаються у
// фейлі без відкриття коду. Споживається тільки тестовим кодом.
// Патерн «message-last»: хелпер приймає контекст очікування і сам збирає
// людське повідомлення — тести не дублюють текст очікувань (DRY).

type ClassLike = new (...args: never[]) => unknown;

function withMessage(error: unknown, message: string): unknown {
  const jestError = error as { message?: string };
  if (typeof jestError?.message === 'string') {
    jestError.message = `${message}\n\n${jestError.message}`;
  }
  return error;
}

/** expect(promise).rejects.toBeInstanceOf(cls) з читабельним повідомленням.
 * @example await expectRejected(useCase.run(), OtpInvalidError, 'невірний OTP') */
export async function expectRejected<E extends ClassLike>(
  promise: Promise<unknown>,
  errorClass: E,
  message: string
): Promise<void> {
  try {
    await expect(promise).rejects.toBeInstanceOf(errorClass);
  } catch (error) {
    throw withMessage(error, `очікували ${errorClass.name} — ${message}`);
  }
}

/** expect(promise).rejects.toThrow(pattern) з читабельним повідомленням. */
export async function expectRejectsWith(
  promise: Promise<unknown>,
  pattern: RegExp,
  message: string
): Promise<void> {
  try {
    await expect(promise).rejects.toThrow(pattern);
  } catch (error) {
    throw withMessage(error, `очікували помилку ${String(pattern)} — ${message}`);
  }
}

/** expect(fn).toThrow(pattern) з читабельним повідомленням (sync-код). */
export function expectSyncThrow(fn: () => unknown, pattern: RegExp, message: string): void {
  try {
    expect(fn).toThrow(pattern);
  } catch (error) {
    throw withMessage(error, `очікували помилку ${String(pattern)} — ${message}`);
  }
}
