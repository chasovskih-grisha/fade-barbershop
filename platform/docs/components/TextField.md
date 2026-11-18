# TextField

Текстове поле на `Field`-обгортці: label + input + help/error. Наслідує `InputHTMLAttributes`.

## API

```ts
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  help?: string;
  error?: string;
}
```

- `id` — опційний; без нього генерується `useId()`.
- `error` → рамка `border-semantic-danger`, `aria-invalid`, `role="alert"`.
- `help`/`error` → `aria-describedby` через `messageIds`.
- `required` → маркер `*` у label.

## Стани

`default · hover · focus-visible (рing) · error · disabled · placeholder`.

## Приклад

```tsx
<TextField
  label="Ім'я"
  placeholder="Як до вас звертатися?"
  required
  error={errors.name}
/>
```

## Do / Don't

- ✓ для всіх однорядкових текстових вводів (ім'я, коментар, промокод…).
- ✓ v-контрольовані поля (`value`/`onChange` з батька).
- ✗ не для телефону (`PhoneInput`) і не для коду (`OtpInput`).
- ✗ валідацію не робити на кожен символ — on blur/submit (UX-політика).