# Checkbox

Чекбокс з label (ReactNode), описом і помилкою. Consent-варіант для AI, відгуків, галереї.

## API

```ts
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: string;
  error?: string;
}
```

- `label` — короткий текст згоди/опції; `description` — muted під ним.
- `error` — `aria-invalid` + `role="alert"`.
- Наслідує `checked`, `onChange`, `disabled` від native input.

## Стани

`default (unchecked) · checked · disabled · error`.

## Do / Don't

- ✓ consent-патерн: явний opt-in, текст простою мовою, посилання на деталі.
- ✗ попередньо відмічені consent-чекбокси заборонені (UX-політика).
- ✗ не робити «галочку» власною реалізацією без native input (доступність).
- ✓ для AI-фото, фото відгуку, галереї — окремий Checkbox у PhotoUpload.