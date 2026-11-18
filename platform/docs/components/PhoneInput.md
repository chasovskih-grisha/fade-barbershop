# PhoneInput

Телефон з маскою `+38`, на виході — E.164. Реєстрація/профіль, `/login` (ADR 0005).

## API

```ts
interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label: string;
  value: string;                    // E.164: +380XXXXXXXXX
  onValueChange: (e164: string) => void;
  help?: string;
  error?: string;
}
```

- Відображення: `+38 (0XX) XXX-XX-XX` (плейсхолдер); введення — `formatPhoneInput`.
- Контрольований: стан телефону (E.164) зберігає батько.
- `type="tel"`, `inputMode="tel"`, `autoComplete="tel"`.

## Стани

`default · hover · focus-visible (рing) · error · disabled · placeholder`.

## Приклад

```tsx
<PhoneInput
  label="Телефон"
  value={phone}
  onValueChange={setPhone}
  error={errors.phone}
/>
```

## Do / Don't

- ✓ тільки цей компонент для номерів телефону клієнта.
- ✓ зберігати/відправляти E.164 (`toE164`), не "красивий" рядок.
- ✗ не цікавитися маскою на бекенді — там лише E.164.
- ✗ не додавати префікс без згоди — за умовчанням `+38` (Україна).