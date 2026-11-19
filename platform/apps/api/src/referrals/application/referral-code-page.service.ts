/**
 * T-4457: видача сторінки «Мій код».
 *
 * Код клієнта створюється при першому відкритті (ідемпотентно: повторний
 * виклик повертає той самий код), реферали беруться лише цього клієнта.
 * Правила — у domain/referral-code-page.ts; тут порти сховища, генератора
 * коду, налаштувань програми й годинника.
 */
import { Inject, Injectable } from '@nestjs/common';
import {
  ReferralCodePageError,
  buildReferralCodePage,
  normalizeReferralProgramConfig,
  type ReferralCodePageView,
  type ReferralProgramConfig,
} from '../domain/referral-code-page';
import { ReferralCode } from '../domain/referral.entity';
import type { ReferralRepository } from './referral.repository';

export const REFERRAL_CODE_GENERATOR = 'REFERRAL_CODE_GENERATOR';
export const REFERRAL_PROGRAM_SETTINGS = 'REFERRAL_PROGRAM_SETTINGS';
export const REFERRAL_CODE_CLOCK = 'REFERRAL_CODE_CLOCK';

export interface ReferralCodeGenerator {
  generate(clientId: string): string;
}

export interface ReferralProgramSettings {
  config: ReferralProgramConfig;
}

export interface ReferralCodeClock {
  now(): Date;
}

/** Код у форматі FADE-XXXXXX; генератор інжектується (тести — детерміновані). */
export class RandomReferralCodeGenerator implements ReferralCodeGenerator {
  generate(_clientId: string): string {
    return `FADE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}

@Injectable()
export class ReferralCodePageService {
  private readonly config: ReferralProgramConfig;

  constructor(
    @Inject('REFERRAL_REPOSITORY')
    private readonly repository: ReferralRepository,
    @Inject(REFERRAL_CODE_GENERATOR)
    private readonly generator: ReferralCodeGenerator,
    @Inject(REFERRAL_PROGRAM_SETTINGS)
    settings: ReferralProgramSettings,
    @Inject(REFERRAL_CODE_CLOCK)
    private readonly clock: ReferralCodeClock
  ) {
    this.config = normalizeReferralProgramConfig(settings.config);
  }

  /**
   * Сторінка клієнта. Якщо коду ще немає — створює й зберігає його, тому
   * перший вхід у розділ уже показує посилання й QR.
   */
  async getPage(clientId: string, now: Date = this.clock.now()): Promise<ReferralCodePageView> {
    const id = clientId.trim();
    if (!id) throw new ReferralCodePageError('Client id is required');

    let referralCode = await this.repository.findCodeByClientId(id);
    if (!referralCode) {
      referralCode = new ReferralCode({
        clientId: id,
        code: this.generator.generate(id),
        createdAt: now,
      });
      await this.repository.saveCode(referralCode);
    }

    const referrals = await this.repository.findByReferrerId(id);
    return buildReferralCodePage({
      code: referralCode.code,
      referrals,
      now,
      config: this.config,
    });
  }

  programConfig(): ReferralProgramConfig {
    return this.config;
  }
}
