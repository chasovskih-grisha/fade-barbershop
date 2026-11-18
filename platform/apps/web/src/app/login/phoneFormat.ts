function nationalDigits(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('380')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 9);
}

export function formatPhone(value: string): string {
  const rest = nationalDigits(value);
  let formatted = '+380';
  if (rest.length > 0) formatted += ` (${rest.slice(0, 2)}`;
  if (rest.length >= 2) formatted += `) ${rest.slice(2, 5)}`;
  if (rest.length >= 5) formatted += `-${rest.slice(5, 7)}`;
  if (rest.length >= 7) formatted += `-${rest.slice(7, 9)}`;
  return formatted;
}

export function unformatPhone(value: string): string {
  return `380${nationalDigits(value)}`;
}

export function toE164(rawPhone: string): string {
  return `+${unformatPhone(rawPhone)}`;
}

export function isCompleteUaPhone(rawPhone: string): boolean {
  return unformatPhone(rawPhone).length === 12;
}
