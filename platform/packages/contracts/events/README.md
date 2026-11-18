# Integration events

Чернетка імен (минулий час, минулий час контексту):

| Подія | Publisher | Subscribers |
|-------|-----------|-------------|
| `scheduling.appointment.booked` | scheduling | crm, notifications, messaging |
| `scheduling.appointment.cancelled` | scheduling | crm, notifications, messaging |
| `messaging.message.sent` | messaging | notifications |
| `content.article.published` | content | web/mobile read-model, notifications (опційно) |
| `billing.payment.captured` | billing | scheduling, notifications |
| `identity.user.registered` | identity | crm |

Схеми JSON — коли з’явиться перша подія в коді. Надійна доставка: transactional outbox, не «save потім publish».

## Ідентифікатори в подіях (T-4300d, ADR 0021)

`eventId` і `aggregateId` — UUID-рядки, ніколи числа: події ходять між
контекстами й інстансами, тож id мусить бути глобально унікальним.

```json
{
  "eventId": "0192f1a4-7c3b-7a8e-9b41-2f6d5c8e0a13",
  "aggregateId": "0192f1a4-7c41-7f0a-8d2e-5b7c9a1e3f60",
  "type": "scheduling.appointment.booked"
}
```
