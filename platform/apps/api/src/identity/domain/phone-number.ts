// PhoneNumber — E.164 для України (ADR 0005). Унікальний ідентифікатор клієнта.
// Нормалізація: результат завжди у вигляді +380XXXXXXXXX (1 джерело правди, без dead-check).

export class PhoneNumber {
  private constructor(public readonly value: string) {}

  static normalize(input: string): string {
    const digits = input.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('380')) return `+${digits}`;
    if (digits.length === 10 && digits.startsWith('0')) return `+38${digits}`;
    throw new Error('Invalid Ukraine phone number');
  }

  static of(input: string): PhoneNumber {
    return new PhoneNumber(PhoneNumber.normalize(input));
  }
}
