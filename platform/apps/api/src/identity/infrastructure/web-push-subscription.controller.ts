import {
  Body,
  Controller,
  Header,
  HttpCode,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Subscription } from 'web-push';
import { ApiTags } from '@nestjs/swagger';

import { ClientSessionGuard, clientSessionOf } from './client-session.guard';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { PrismaPushTokenRepository } from './prisma-push-token-repository';
import { UuidIdGenerator } from './uuid-id-generator';
import { PushToken, type PushPlatform } from '../domain/push-token';
import type { PushTokenRepository } from '../domain/ports';

function isPushPlatform(value: string | undefined): value is PushPlatform {
  return value === 'ios' || value === 'android' || value === 'web';
}

@ApiTags('identity')
@Controller('identity/client')
@UseGuards(ClientSessionGuard)
@UseFilters(IdentityExceptionFilter)
export class WebPushSubscriptionController {
  constructor(
    @Inject(PrismaPushTokenRepository)
    private readonly pushTokenRepo: PushTokenRepository,
    private readonly ids: UuidIdGenerator
  ) {}

  @Post('push-subscribe')
  @HttpCode(200)
  @Header('Content-Type', 'application/json')
  async subscribe(
    @Req() req: Request,
    @Body() body: { subscription: Subscription; platform?: string }
  ): Promise<{ ok: boolean }> {
    const session = clientSessionOf(req);
    if (!session) throw new UnauthorizedException('Client session required');

    await this.pushTokenRepo.save(
      PushToken.register({
        id: this.ids.id(),
        userId: session.userId,
        sessionId: session.sessionId,
        token: body.subscription.endpoint,
        platform: isPushPlatform(body.platform) ? body.platform : 'web',
        at: new Date(),
      })
    );

    return { ok: true };
  }
}
