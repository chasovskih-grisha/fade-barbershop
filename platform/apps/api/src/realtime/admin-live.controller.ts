// SSE-шлях живого оновлення адмінки (T-045): клієнт тримає EventSource на
// /admin/live/events і на кожне сповіщення перечитує календар/дашборд. Потік
// віддає лише сигнал (тип + id візиту) — без персональних даних. Доступ
// охороняє AdminSessionGuard (APP_GUARD), що покриває всі /admin/*.
import { Controller, Sse, type MessageEvent } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { map, type Observable } from 'rxjs';
import { AdminLiveFeed } from './admin-live-feed';
import type { AdminLiveNotice } from './admin-live-types';

/** Ім'я SSE-події, яку слухає EventSource у клієнті (addEventListener). */
export const ADMIN_LIVE_EVENT = 'appointment';

@ApiTags('admin-live')
@Controller('admin/live')
export class AdminLiveController {
  constructor(private readonly feed: AdminLiveFeed) {}

  @Sse('events')
  @ApiOperation({ summary: 'Живий потік подій візитів (SSE): сигнал перечитати екран' })
  events(): Observable<MessageEvent> {
    return this.feed.stream$.pipe(
      map((notice: AdminLiveNotice) => ({ type: ADMIN_LIVE_EVENT, data: notice }))
    );
  }
}
