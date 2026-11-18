# ChatBubble

Одне повідомлення чату. Три автори з різним вирівнюванням і фоном.

## API

```ts
type ChatAuthor = 'client' | 'staff' | 'system';

interface ChatBubbleProps {
  author: ChatAuthor;
  text: string;
  time?: string;             // "10:47"
  className?: string;
}
```

| author | Вирівнювання | Фон |
|--------|--------------|-----|
| client | праворуч (`self-end`) | `bg-accent`, текст `accent-fg` |
| staff | ліворуч (`self-start`) | `bg-surface-raised`, текст `fg` |
| system | по центру (`self-center`) | `bg-interactive` + caption muted |

Макс. ширина 80% контейнера; час — caption з зниженою непрозорістю.

## Стани

`client · staff · system · з/без time`.

## Приклад

```tsx
<div className="flex flex-col gap-2">
  <ChatBubble author="client" text="Коли можна на фейд?" />
  <ChatBubble author="staff" text="Завтра, о 14:00" time="10:47" />
  <ChatBubble author="system" text="Запис підтверджено" />
</div>
```

## Do / Don't

- ✓ для повідомлень між клієнтом і барбером та системних сповіщень.
- ✓ список повідомлень збирає батько (auto-scroll, угруповання за днями).
- ✗ не для будь-якого текстового блоку — тільки чат.
- ✗ не робити посилання/кнопки всередині text — окремі елементи.