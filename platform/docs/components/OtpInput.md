# OtpInput

Шість комірок коду з SMS. `/login`, відновлення доступу.

## API

```ts
interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}
```

- Авто-перехід на наступну комірку; Backspace — видалення і повернення.
- Вставка коду з буфера заповнює комірки з позиції курсора.
- `onComplete` — коли 6 цифр (для авто-відправки коду).
- `aria-label` на кожну комірку, `role="group"`, `aria-invalid`/`role="alert"` при error.

## Стани

`default · focus (комірка) · error · disabled`.

## Приклад

```tsx
<OtpInput
  value={code}
  onChange={setCode}
  onComplete={(full) => verify(full)}
  disabled={sending}
/>
```

## Do / Don't

- ✓ 6 цифр з SMS; `error` показувати як «Введіть 6 цифр з SMS».
- ✓ авто-відправку робити на `onComplete`, а не на кожен символ.
- ✗ не робити OTP для клієнтського логіна іншим способом (ADR 0005).
- ✗ не приймати латинські літери/символи — тільки цифри.