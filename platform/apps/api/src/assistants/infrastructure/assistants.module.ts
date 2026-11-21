import { Module } from '@nestjs/common';
import { AGENT_LOG } from '../application/agent-log.repository';
import { InMemoryAgentLogRepository } from '../application/in-memory-agent-log.repository';

/** Контекст `assistants` у моноліті (T-280b, ADR 0020). Журнал агента —
 * in-memory, доки слайс c не дасть схему зберігання. */
@Module({
  providers: [{ provide: AGENT_LOG, useClass: InMemoryAgentLogRepository }],
  exports: [AGENT_LOG],
})
export class AssistantsModule {}
