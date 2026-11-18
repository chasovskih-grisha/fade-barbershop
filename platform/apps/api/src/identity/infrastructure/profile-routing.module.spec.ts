import { Test, TestingModule } from '@nestjs/testing';
import { ProfileRoutingModule } from './profile-routing.module';
import { CrmModule } from '../../crm/crm.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { CrmExceptionFilter } from '../../crm/infrastructure/crm.exception-filter';
import { ClientSessionGuard } from './client-session.guard';
import { PrismaSessionRepository } from './prisma-session-repository';
import { AdminSessionGuard } from './admin-session.guard';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { PrismaOutboxPublisher } from './prisma-outbox-publisher';
import { PrismaPushTokenRepository } from './prisma-push-token-repository';
import { PrismaLoginAudit } from './prisma-login-audit';
import { PrismaOtpChallengeRepository } from './prisma-otp-challenge-repository';
import { PrismaUserRepository } from './prisma-user-repository';
import { CrmClientProfilesAdapter } from './crm-client-profiles.adapter';
import { OtpSenderFactory } from './otp-sender.factory';
import { ClientProfileController } from './client-profile.controller';
import { PrismaClientProfileRepository } from '../../crm/infrastructure/prisma-client-profile.repository';
import { identityOtpProviders } from './identity-otp.providers';
import { identityBarberProviders } from './identity-barber.providers';
import { identityAccountProviders } from './identity-account.providers';
import { identitySessionProviders } from './identity-session.providers';
import { uuidv7 } from '@fade/domain-shared';

const FakePrismaService = { $connect: jest.fn(), $disconnect: jest.fn() };
const FakeClock = { now: jest.fn() };
const FakeIdGenerator = { id: jest.fn(() => uuidv7()) };

const FakeOtpChallengeRepository = { findLastByPhone: jest.fn(), save: jest.fn() };
const FakeUserRepository = { findById: jest.fn(), findByPhone: jest.fn(), listAdminIds: jest.fn() };
const FakeClientProfileRepository = {
  findById: jest.fn(),
  findByUserId: jest.fn(),
  save: jest.fn(),
};
const FakeOtpSenderFactory = { build: jest.fn(() => ({ send: jest.fn() })) };

describe('ProfileRoutingModule', () => {
  it('should compile with PrismaService and CrmModule', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ProfileRoutingModule],
    })
      .overrideProvider(PrismaService)
      .useValue(FakePrismaService)
      .overrideProvider(SystemClock)
      .useValue(FakeClock)
      .overrideProvider(UuidIdGenerator)
      .useValue(FakeIdGenerator)
      .overrideProvider(PrismaSessionRepository)
      .useValue(new PrismaSessionRepository({} as never))
      .overrideProvider(ClientSessionGuard)
      .useValue(new ClientSessionGuard(new PrismaSessionRepository({} as never)))
      .overrideProvider(AdminSessionGuard)
      .useValue(new AdminSessionGuard(new PrismaSessionRepository({} as never), {} as never))
      .overrideProvider(OtpSenderFactory)
      .useValue(FakeOtpSenderFactory)
      .overrideProvider(PrismaOutboxPublisher)
      .useValue({ publish: jest.fn() })
      .overrideProvider(PrismaPushTokenRepository)
      .useValue({ findByUserId: jest.fn(), delete: jest.fn() })
      .overrideProvider(PrismaLoginAudit)
      .useValue({ record: jest.fn() })
      .overrideProvider(PrismaOtpChallengeRepository)
      .useValue(FakeOtpChallengeRepository)
      .overrideProvider(PrismaUserRepository)
      .useValue(FakeUserRepository)
      .overrideProvider(CrmClientProfilesAdapter)
      .useValue({})
      .overrideProvider(PrismaUnitOfWork)
      .useValue({ run: jest.fn((work) => work()) })
      .overrideProvider(identityOtpProviders[0])
      .useValue({})
      .overrideProvider(identityBarberProviders[0])
      .useValue({})
      .overrideProvider(identityAccountProviders[0])
      .useValue({})
      .overrideProvider(identitySessionProviders[0])
      .useValue({})
      .overrideProvider(PrismaClientProfileRepository)
      .useValue(FakeClientProfileRepository)
      .compile();

    expect(moduleRef.get(PrismaService)).toBeDefined();
    expect(moduleRef.get(CrmModule)).toBeDefined();
    expect(moduleRef.get(ProfileRoutingModule)).toBeDefined();
    expect(moduleRef.get(ClientProfileController)).toBeDefined();
    expect(moduleRef.get(CrmExceptionFilter)).toBeDefined();
    expect(moduleRef.get(ClientSessionGuard)).toBeDefined();
    expect(moduleRef.get(AdminSessionGuard)).toBeDefined();
    expect(moduleRef.get(PrismaLoginAudit)).toBeDefined();
    expect(moduleRef.get(PrismaOtpChallengeRepository)).toBeDefined();
    expect(moduleRef.get(PrismaUserRepository)).toBeDefined();
    expect(moduleRef.get(CrmClientProfilesAdapter)).toBeDefined();
    expect(moduleRef.get(PrismaUnitOfWork)).toBeDefined();
  });
});
