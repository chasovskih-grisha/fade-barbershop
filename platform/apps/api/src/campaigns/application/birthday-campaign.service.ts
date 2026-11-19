/**
 * T-4459: запуск авто-кампанії «День народження».
 *
 * Правила (вікно, згода, «раз на рік», 29 лютого) — у domain/birthday-campaign.
 * Тут порти: джерело клієнтів, шлюз доставки, журнал надсилань і аудиту,
 * годинник. Журнал in-memory: у `prisma/schema.prisma` ще немає таблиці
 * надсилань, порт готовий прийняти Prisma-адаптер.
 */
import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_BIRTHDAY_CAMPAIGN_CONFIG,
  BirthdayCampaignError,
  normalizeBirthdayCampaignConfig,
  planBirthdayCampaign,
  verifyBirthdayDate,
  type BirthdayAuditEntry,
  type BirthdayCampaignChannel,
  type BirthdayCampaignClient,
  type BirthdayCampaignConfig,
  type BirthdayCampaignPlan,
  type BirthdayDate,
} from '../domain/birthday-campaign';

export const BIRTHDAY_CAMPAIGN_CLIENTS = 'BIRTHDAY_CAMPAIGN_CLIENTS';
export const BIRTHDAY_CAMPAIGN_GATEWAY = 'BIRTHDAY_CAMPAIGN_GATEWAY';
export const BIRTHDAY_CAMPAIGN_LOG = 'BIRTHDAY_CAMPAIGN_LOG';
export const BIRTHDAY_CAMPAIGN_CLOCK = 'BIRTHDAY_CAMPAIGN_CLOCK';

export interface BirthdayCampaignClock {
  now(): Date;
}

export interface BirthdayCampaignClientSource {
  list(): Promise<BirthdayCampaignClient[]>;
  get(clientId: string): Promise<BirthdayCampaignClient | null>;
  setBirthday(input: {
    clientId: string;
    birthday: BirthdayDate;
    confirmed: boolean;
  }): Promise<void>;
}

export class InMemoryBirthdayCampaignClients implements BirthdayCampaignClientSource {
  private readonly clients = new Map<string, BirthdayCampaignClient>();

  constructor(seed: BirthdayCampaignClient[] = []) {
    for (const client of seed) this.clients.set(client.clientId, { ...client });
  }

  async list(): Promise<BirthdayCampaignClient[]> {
    return [...this.clients.values()].map((client) => ({ ...client }));
  }

  async get(clientId: string): Promise<BirthdayCampaignClient | null> {
    const client = this.clients.get(clientId);
    return client ? { ...client } : null;
  }

  async setBirthday(input: {
    clientId: string;
    birthday: BirthdayDate;
    confirmed: boolean;
  }): Promise<void> {
    const client = this.clients.get(input.clientId);
    if (!client) throw new BirthdayCampaignError(`Client ${input.clientId} not found`);
    this.clients.set(input.clientId, {
      ...client,
      birthday: { day: input.birthday.day, month: input.birthday.month },
      birthdayConfirmed: input.confirmed,
    });
  }
}

export interface BirthdayCampaignGateway {
  send(input: {
    clientId: string;
    channels: BirthdayCampaignChannel[];
    text: string;
    occurrenceYear: number;
    discountPercent: number;
  }): Promise<void>;
}

export interface BirthdayDeliveryRecord {
  fingerprint: string;
  clientId: string;
  year: number;
  at: Date;
  channels: BirthdayCampaignChannel[];
  discountPercent: number;
  text: string;
}

export interface BirthdayCampaignLog {
  offeredFingerprints(): ReadonlySet<string>;
  recordDelivery(record: BirthdayDeliveryRecord): void;
  recordAudit(entry: BirthdayAuditEntry): void;
  deliveries(): BirthdayDeliveryRecord[];
  audits(): BirthdayAuditEntry[];
}

export class InMemoryBirthdayCampaignLog implements BirthdayCampaignLog {
  private readonly fingerprints = new Set<string>();
  private readonly deliveryLog: BirthdayDeliveryRecord[] = [];
  private readonly auditLog: BirthdayAuditEntry[] = [];

  offeredFingerprints(): ReadonlySet<string> {
    return this.fingerprints;
  }

  recordDelivery(record: BirthdayDeliveryRecord): void {
    if (this.fingerprints.has(record.fingerprint)) return;
    this.fingerprints.add(record.fingerprint);
    this.deliveryLog.push(record);
  }

  recordAudit(entry: BirthdayAuditEntry): void {
    this.auditLog.push(entry);
  }

  deliveries(): BirthdayDeliveryRecord[] {
    return [...this.deliveryLog];
  }

  audits(): BirthdayAuditEntry[] {
    return [...this.auditLog];
  }
}

export interface BirthdayCampaignRunSummary {
  sent: number;
  suppressed: Array<{ clientId: string; reason: string }>;
  offers: BirthdayCampaignPlan['offers'];
}

@Injectable()
export class BirthdayCampaignService {
  private readonly config: BirthdayCampaignConfig;

  constructor(
    @Inject(BIRTHDAY_CAMPAIGN_CLIENTS)
    private readonly clients: BirthdayCampaignClientSource,
    @Inject(BIRTHDAY_CAMPAIGN_GATEWAY)
    private readonly gateway: BirthdayCampaignGateway,
    @Inject(BIRTHDAY_CAMPAIGN_LOG)
    private readonly log: BirthdayCampaignLog,
    @Inject(BIRTHDAY_CAMPAIGN_CLOCK)
    private readonly clock: BirthdayCampaignClock,
    config: Partial<BirthdayCampaignConfig> = DEFAULT_BIRTHDAY_CAMPAIGN_CONFIG
  ) {
    this.config = normalizeBirthdayCampaignConfig(config);
  }

  /** Що буде надіслано зараз — без побічних ефектів (для адмін-прев'ю). */
  async preview(now: Date = this.clock.now()): Promise<BirthdayCampaignPlan> {
    return planBirthdayCampaign({
      clients: await this.clients.list(),
      now,
      config: this.config,
      offeredFingerprints: this.log.offeredFingerprints(),
    });
  }

  /** Планує й надсилає; кожен оффер фіксується у журналі до відправки. */
  async run(now: Date = this.clock.now()): Promise<BirthdayCampaignRunSummary> {
    const plan = await this.preview(now);
    let sent = 0;

    for (const offer of plan.offers) {
      this.log.recordDelivery({
        fingerprint: offer.fingerprint,
        clientId: offer.clientId,
        year: offer.occurrenceYear,
        at: now,
        channels: offer.channels,
        discountPercent: offer.discountPercent,
        text: offer.text,
      });

      await this.gateway.send({
        clientId: offer.clientId,
        channels: offer.channels,
        text: offer.text,
        occurrenceYear: offer.occurrenceYear,
        discountPercent: offer.discountPercent,
      });
      sent += 1;
    }

    return { sent, suppressed: plan.suppressed, offers: plan.offers };
  }

  /** Підтвердження або ручна зміна дати з аудитом (адмінка). */
  async verifyDate(input: {
    clientId: string;
    birthday: BirthdayDate;
    by: string;
    source?: 'client' | 'admin';
    at?: Date;
  }): Promise<{ audit: BirthdayAuditEntry; client: BirthdayCampaignClient }> {
    const client = await this.clients.get(input.clientId);
    if (!client) throw new BirthdayCampaignError(`Client ${input.clientId} not found`);

    const audit = verifyBirthdayDate({
      clientId: input.clientId,
      birthday: input.birthday,
      previous: client.birthday,
      by: input.by,
      at: input.at ?? this.clock.now(),
      ...(input.source ? { source: input.source } : {}),
    });

    await this.clients.setBirthday({
      clientId: input.clientId,
      birthday: input.birthday,
      confirmed: true,
    });
    this.log.recordAudit(audit);

    return {
      audit,
      client: {
        ...client,
        birthday: { day: input.birthday.day, month: input.birthday.month },
        birthdayConfirmed: true,
      },
    };
  }

  /** Журнал надсилань — для адмін-екрана й перевірки ліміту. */
  history(): {
    deliveries: BirthdayDeliveryRecord[];
    audits: BirthdayAuditEntry[];
    config: BirthdayCampaignConfig;
  } {
    return {
      deliveries: this.log.deliveries(),
      audits: this.log.audits(),
      config: this.config,
    };
  }
}
