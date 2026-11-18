import { GiftCertificate } from '../domain/gift-certificate.entity';
import { GiftCertificateRepository, CertificateCodeGenerator, GiftCertificateOutbox } from './ports';
import { CreateGiftCertificateHandler } from './create-gift-certificate.use-case';
import { RedeemGiftCertificateHandler } from './redeem-gift-certificate.use-case';
import { CheckGiftCertificateBalanceHandler } from './check-gift-certificate-balance.use-case';

class InMemoryGiftCertificateRepository implements GiftCertificateRepository {
  private map = new Map<string, GiftCertificate>();

  async findByCode(code: string): Promise<GiftCertificate | null> {
    const normalized = code.trim().toUpperCase();
    for (const cert of this.map.values()) {
      if (cert.code === normalized) {
        return cert;
      }
    }
    return null;
  }

  async findById(id: string): Promise<GiftCertificate | null> {
    return this.map.get(id) ?? null;
  }

  async save(cert: GiftCertificate): Promise<void> {
    this.map.set(cert.id, cert);
  }
}

class MockCodeGenerator implements CertificateCodeGenerator {
  generateCode(): string {
    return 'FADE-TEST-1234';
  }
}

class MockOutbox implements GiftCertificateOutbox {
  events: Array<any> = [];
  async append(events: Array<any>): Promise<void> {
    this.events.push(...events);
  }
}

describe('Gift Certificate Use Cases', () => {
  const now = new Date('2026-06-01T10:00:00Z');
  let repo: InMemoryGiftCertificateRepository;
  let codeGen: MockCodeGenerator;
  let outbox: MockOutbox;

  beforeEach(() => {
    repo = new InMemoryGiftCertificateRepository();
    codeGen = new MockCodeGenerator();
    outbox = new MockOutbox();
  });

  it('should create gift certificate and emit sold event', async () => {
    const handler = new CreateGiftCertificateHandler(repo, codeGen, outbox);
    const result = await handler.handle({
      id: 'gc-1',
      initialAmount: 1500,
      currency: 'UAH',
      purchaserPhone: '+380509998877',
      occurredAt: now,
    });

    expect(result.code).toBe('FADE-TEST-1234');
    expect(result.initialAmount).toBe(1500);
    expect(outbox.events.length).toBe(1);
    expect(outbox.events[0].type).toBe('gift-certificate.sold');
  });

  it('should redeem gift certificate partially or fully and emit redeemed event', async () => {
    const createHandler = new CreateGiftCertificateHandler(repo, codeGen, outbox);
    await createHandler.handle({
      id: 'gc-1',
      initialAmount: 1000,
      occurredAt: now,
    });

    const redeemHandler = new RedeemGiftCertificateHandler(repo, outbox);
    const res = await redeemHandler.handle({
      code: 'fade-test-1234',
      amount: 400,
      appointmentId: 'appt-1',
      occurredAt: now,
    });

    expect(res.redeemedAmount).toBe(400);
    expect(res.remainingBalance).toBe(600);
    expect(res.status).toBe('partially_used');
    expect(outbox.events.filter((e) => e.type === 'gift-certificate.redeemed').length).toBe(1);
  });

  it('should check gift certificate balance', async () => {
    const createHandler = new CreateGiftCertificateHandler(repo, codeGen, outbox);
    await createHandler.handle({
      id: 'gc-1',
      initialAmount: 2000,
      occurredAt: now,
    });

    const checkHandler = new CheckGiftCertificateBalanceHandler(repo);
    const balanceInfo = await checkHandler.handle({
      code: 'FADE-TEST-1234',
      now,
    });

    expect(balanceInfo.found).toBe(true);
    expect(balanceInfo.initialAmount).toBe(2000);
    expect(balanceInfo.remainingBalance).toBe(2000);
    expect(balanceInfo.status).toBe('active');
    expect(balanceInfo.expired).toBe(false);
  });

  it('should return not found for unknown code', async () => {
    const checkHandler = new CheckGiftCertificateBalanceHandler(repo);
    const balanceInfo = await checkHandler.handle({
      code: 'UNKNOWN',
      now,
    });

    expect(balanceInfo.found).toBe(false);
  });
});
