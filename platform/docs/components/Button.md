# Button

Головні дії інтерфейсу. Скрізь на клієнтських і адмін-поверхнях.

## API

```ts
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}
```

- `variant` — primary (Bone/акцент), secondary (interactive), ghost (без фону), destructive (danger).
- `size` — md (h-11), lg (h-12).
- `loading` — спинер + `aria-busy="true"` + блокування; `type` завжди `button`.
- Приймає звичайні атрибути кнопки (`disabled`, `onClick`, `aria-*`).

## Стани

`default · hover · active · focus-visible (рing) · disabled (opacity-50) · loading`.

## Приклад

```tsx
<Button loading={isBooking} onClick={book}>Записатися</Button>
<Button variant="destructive" onClick={cancel}>Скасувати запис</Button>
```

## Do / Don't

- ✓ примитив для всіх кнопок, включно із `secondary`/`ghost` у Modals.
- ✓ `loading` для дій із мережею замість повторних кліків.
- ✗ не робити посилання кнопкою — для навігації свій семантичний елемент.
- ✗ не міняти variant/колір на ходу в одному екрані-флоу.