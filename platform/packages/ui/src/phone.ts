const UA_COUNTRY_CODE = '38';
const NATIONAL_LENGTH = 10;

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function nationalDigits(value: string): string {
  let digits = phoneDigits(value);
  if (digits.startsWith('380')) digits = digits.slice(3);
  else if (digits.startsWith('38')) digits = digits.slice(2);
  if (digits && !digits.startsWith('0')) digits = `0${digits}`;
  return digits.slice(0, NATIONAL_LENGTH);
}

export function toE164(value: string): string {
  const digits = nationalDigits(value);
  return digits.length === NATIONAL_LENGTH ? `+${UA_COUNTRY_CODE}${digits}` : '';
}

export function formatPhoneInput(value: string): string {
  const digits = nationalDigits(value);
  if (!digits) return '';
  const operator = digits.slice(0, 3);
  const part1 = digits.slice(3, 6);
  const part2 = digits.slice(6, 8);
  const part3 = digits.slice(8, NATIONAL_LENGTH);
  let output = `+${UA_COUNTRY_CODE} (${operator}`;
  if (digits.length >= 3) output += ')';
  if (part1) output += ` ${part1}`;
  if (part2) output += `-${part2}`;
  if (part3) output += `-${part3}`;
  return output;
}
