// T-091/PAY-006: єдина HTTP-точка, куди приходить подія еквайрингу без участі
// клієнта. Сигнатура звіряється з сирим тілом (`rawBody: true` у main.ts):
// перепакований JSON не пройшов би HMAC, тому тіло не парситься до перевірки.
//
// Відповідь провайдеру — завжди JSON і ніколи не виняток: 400 на невалідну
// сигнатуру/конверт (підробку не ретраять), 200 на прийняту подію (включно з
// dead-letter), 503/500 — на конфіг і збої обробки (повтор безпечний).
import { Controller, HttpCode, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import { StripeAcquiringGateway } from '../../billing/infrastructure/stripe-acquiring.gateway';
import {
  ProcessStripeWebhookHandler,
  type ProcessStripeWebhookInput,
} from '../../billing/application/process-stripe-webhook.use-case';
import { SettleWebhookCapture } from '../application/settle-webhook-capture.use-case';
import { verifyIncomingWebhook, type StripeEnvelope } from './stripe-webhook-request';

@Controller('payment/webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger('StripeWebhook');

  constructor(
    private readonly handler: ProcessStripeWebhookHandler,
    private readonly settle: SettleWebhookCapture,
    private readonly acquiring: StripeAcquiringGateway
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Res({ passthrough: true }) response: Response
  ): Promise<Record<string, unknown>> {
    const verified = verifyIncomingWebhook(
      request,
      process.env.STRIPE_WEBHOOK_SECRET,
      (payload, signature, secret) =>
        this.acquiring.verifyWebhookSignature(payload, signature, secret)
    );
    if (!verified.ok) {
      if (verified.status === HttpStatus.SERVICE_UNAVAILABLE) {
        // Без секрету підпис не перевірити — приймати подію не можна.
        this.logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      }
      response.status(verified.status);
      return { received: false, error: verified.error };
    }

    try {
      return await this.process(verified.envelope, request.headers['x-request-id']);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`stripe webhook ${verified.envelope.type} failed: ${message}`);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return { received: false, error: 'processing_failed' };
    }
  }

  private async process(
    envelope: StripeEnvelope,
    requestId: string | string[] | undefined
  ): Promise<Record<string, unknown>> {
    const input: ProcessStripeWebhookInput = {
      ...(envelope.id ? { eventId: envelope.id } : {}),
      eventType: envelope.type,
      eventObject: envelope.data.object as ProcessStripeWebhookInput['eventObject'],
      traceId: (Array.isArray(requestId) ? requestId[0] : requestId) || envelope.id || 'stripe_webhook',
    };

    const result = await this.handler.handle(input);
    // Крісло закривається лише після того, як платіж став paid: інакше пізній
    // capture підтвердив би вже перепроданий слот.
    const settlement =
      result.processed && result.paymentId ? await this.settle.execute(result.paymentId) : undefined;

    return {
      received: true,
      processed: result.processed,
      ...(result.alreadyProcessed ? { alreadyProcessed: true } : {}),
      ...(result.deadLettered ? { deadLettered: true } : {}),
      ...(settlement ? { settlement } : {}),
    };
  }
}
