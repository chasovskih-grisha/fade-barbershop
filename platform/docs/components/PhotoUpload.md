# PhotoUpload

Завантаження фото: AI-фото, фото відгуку. «Прес» (прямокутник-кнопка) + consent-чекбокс.

## API

```ts
interface PhotoUploadProps {
  label: string;
  onSelect: (file: File) => void;
  previewUrl?: string;                // превʼю обраного фото
  consent?: boolean;                  // стан consent-чекбокса
  onConsentChange?: (checked: boolean) => void;  // заданий — вмикає чекбокс
  consentLabel?: string;              // за замовченням «Дозволяю обробку фото»
  error?: string;
  disabled?: boolean;
  className?: string;
}
```

- `input[type=file] accept="image/*"` — `sr-only` усередині кнопки-пресу.
- `error` — рамка danger + `role="alert"`.
- Consent — завжди окремий явний opt-in, ніколи не попередньо відмічений.

## Стани

`default · hover · focus-within · error · disabled · consent un/checked`.

## Приклад

```tsx
<PhotoUpload
  label="Додати фото"
  previewUrl={preview}
  onSelect={onFile}
  consent={consent}
  onConsentChange={setConsent}
  error={errors.photo}
/>
```

## Do / Don't

- ✓ для AI-фото і фото відгуку — через цей компонент.
- ✓ consent-чекбокс простою мовою з посиланням на деталі (UX-політика).
- ✗ попередньо відмічений consent.
- ✗ завантажувати фото без превʼю на екрані (підтвердження вибору).