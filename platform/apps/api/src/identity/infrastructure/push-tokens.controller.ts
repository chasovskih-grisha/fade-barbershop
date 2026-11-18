// Push-канал пристрою (T-070 mobile / T-4422 безпека): реєстрація і
// відкликання Expo-токена. Окремий контролер від сесій (гейт max-lines,
// ADR 0019): там — список пристроїв і «вийти скрізь», тут — лише канал
// сповіщень. Гвард і мапер помилок ті самі, що в ClientSessionsController.

import { Body, Controller, Inject, Post, Req, UseFilters, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type {
  RegisterPushTokenInput,
  RegisterPushTokenResult,
  RevokePushTokenInput,
  RevokePushTokenResult,
} from '@fade/contracts';
import { ClientSessionGuard } from './client-session.guard';
import { IdentityExceptionFilter } from './identity.exception-filter';
import { toHttp } from './identity-http.mapper';
import { requireClientSession, type ClientSessionUseCases } from './client-sessions.controller';

@Controller('identity/client')
@UseFilters(IdentityExceptionFilter)
@UseGuards(ClientSessionGuard)
export class PushTokensController {
  constructor(
    @Inject('CLIENT_SESSION_USE_CASES') private readonly useCases: ClientSessionUseCases
  ) {}

  /** Пристрій реєструє push-токен — з цієї миті канал сповіщень дозволений. */
  @Post('push-tokens')
  async registerPushToken(
    @Req() req: Request,
    @Body() body: RegisterPushTokenInput
  ): Promise<RegisterPushTokenResult> {
    const session = requireClientSession(req);
    try {
      return await this.useCases.registerPush.handle({
        userId: session.userId,
        sessionId: session.sessionId,
        token: String(body?.token ?? ''),
        platform: body?.platform,
      });
    } catch (error) {
      throw toHttp(error);
    }
  }

  /** Вимкнути канал цього пристрою (вихід з акаунта); ідемпотентно.
   * POST (не DELETE): тіло з токеном на DELETE частина клієнтів зрізає. */
  @Post('push-tokens/revoke')
  async revokePushToken(
    @Req() req: Request,
    @Body() body: RevokePushTokenInput
  ): Promise<RevokePushTokenResult> {
    const session = requireClientSession(req);
    return this.useCases.revokePush.handle({
      userId: session.userId,
      token: String(body?.token ?? ''),
    });
  }
}
