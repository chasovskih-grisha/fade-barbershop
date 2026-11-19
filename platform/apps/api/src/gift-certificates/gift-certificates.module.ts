// T-4456: модуль погашення сертифікатів барбером. Сховище, журнал і годинник —
// in-memory до появи Prisma-таблиць; outbox лише фіксує подію
// `gift-certificate.redeemed`, доки немає черги.
import { Module } from '@nestjs/common';
import {
  BarberCertificateRedemptionService,
  CERTIFICATE_REDEMPTION_CLOCK,
  CERTIFICATE_REDEMPTION_LEDGER,
  InMemoryCertificateRedemptionLedger,
  InMemoryGiftCertificateRepository,
} from './application/barber-certificate-redemption.service';
import type { GiftCertificateOutbox } from './application/ports';
import {
  AdminCertificateController,
  BarberCertificateController,
} from './infrastructure/barber-certificate.controller';

class RecordingCertificateOutbox implements GiftCertificateOutbox {
  private readonly events: Array<{ type: string; payload: Record<string, unknown> }> = [];

  async append(events: Array<{ type: string; payload: Record<string, unknown> }>): Promise<void> {
    this.events.push(...events);
  }

  list(): Array<{ type: string; payload: Record<string, unknown> }> {
    return [...this.events];
  }
}

@Module({
  controllers: [BarberCertificateController, AdminCertificateController],
  providers: [
    BarberCertificateRedemptionService,
    { provide: 'GIFT_CERTIFICATE_REPOSITORY', useClass: InMemoryGiftCertificateRepository },
    { provide: 'GIFT_CERTIFICATE_OUTBOX', useClass: RecordingCertificateOutbox },
    { provide: CERTIFICATE_REDEMPTION_LEDGER, useClass: InMemoryCertificateRedemptionLedger },
    { provide: CERTIFICATE_REDEMPTION_CLOCK, useFactory: () => ({ now: () => new Date() }) },
  ],
  exports: [BarberCertificateRedemptionService],
})
export class GiftCertificatesModule {}
