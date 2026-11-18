import { InMemoryReferralRepository } from './application/in-memory-referral.repository';
import { GenerateReferralCodeUseCase, RegisterReferralUseCase, QualifyReferralUseCase, DefaultFraudCheckService } from './application/referral.use-cases';

describe('Referral Engine & Program (T-4554)', () => {
  let repo: InMemoryReferralRepository;
  let generateCode: GenerateReferralCodeUseCase;
  let registerRef: RegisterReferralUseCase;
  let qualifyRef: QualifyReferralUseCase;
  let fraudCheck: DefaultFraudCheckService;

  beforeEach(() => {
    repo = new InMemoryReferralRepository();
    fraudCheck = new DefaultFraudCheckService();
    generateCode = new GenerateReferralCodeUseCase(repo);
    registerRef = new RegisterReferralUseCase(repo, fraudCheck);
    qualifyRef = new QualifyReferralUseCase(repo);
  });

  it('should generate a unique referral code for a client', async () => {
    const codeObj = await generateCode.execute('client_123');
    expect(codeObj.code).toBeDefined();
    expect(codeObj.clientId).toBe('client_123');

    const fetched = await repo.findCodeByCode(codeObj.code);
    expect(fetched?.clientId).toBe('client_123');
  });

  it('should register a referral when a friend uses a valid code', async () => {
    const referrerCode = await generateCode.execute('client_referrer');
    
    const referral = await registerRef.execute({
      referrerCode: referrerCode.code,
      referredClientId: 'client_friend',
      ipAddress: '192.168.1.10',
    });

    expect(referral.status).toBe('PENDING');
    expect(referral.referrerId).toBe('client_referrer');
    expect(referral.referredId).toBe('client_friend');
  });

  it('should prevent self-referral', async () => {
    const referrerCode = await generateCode.execute('client_self');

    await expect(
      registerRef.execute({
        referrerCode: referrerCode.code,
        referredClientId: 'client_self',
      })
    ).rejects.toThrow('Self-referral is not allowed');
  });

  it('should qualify and reward referral upon appointment completion', async () => {
    const referrerCode = await generateCode.execute('client_referrer');
    await registerRef.execute({
      referrerCode: referrerCode.code,
      referredClientId: 'client_friend',
    });

    const updated = await qualifyRef.execute('client_friend');
    expect(updated?.status).toBe('REWARDED');
    expect(updated?.qualifiedAt).toBeDefined();
    expect(updated?.rewardIssuedAt).toBeDefined();
  });
});
