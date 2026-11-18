import { Module } from '@nestjs/common';
import { ClientProfileController } from './client-profile.controller';
import { ClientBirthdayController } from './client-birthday.controller';
import { PrismaClientProfileRepository } from '../../crm/infrastructure/prisma-client-profile.repository';
import { CrmModule } from '../../crm/crm.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaSessionRepository } from './prisma-session-repository';
import { PrismaOutboxPublisher } from './prisma-outbox-publisher';
import { PrismaPushTokenRepository } from './prisma-push-token-repository';
import { PrismaLoginAudit } from './prisma-login-audit';
import { PrismaOtpChallengeRepository } from './prisma-otp-challenge-repository';
import { PrismaUserRepository } from './prisma-user-repository';
import { PrismaBarberPhotoRepository } from './prisma-barber-photo.repository';
import { S3PublicMediaStorage } from '../../shared/media/s3-public-media-storage';
import { CrmClientProfilesAdapter } from './crm-client-profiles.adapter';
import { OtpSenderFactory } from './otp-sender.factory';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { AdminSessionGuard } from './admin-session.guard';
import { identityOtpProviders } from './identity-otp.providers';
import { identityBarberProviders } from './identity-barber.providers';
import { identityAccountProviders } from './identity-account.providers';
import { identitySessionProviders } from './identity-session.providers';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';

// Маршрутизований модуль клієнтського профілю (T-??): окремий шар маршрутизації
// поверх CRM-хендлерів. PrismaService надається тут для інфраструктурних
// потреб; реальна бізнес-логіка залишається в CrmModule.
@Module({
  imports: [CrmModule],
  controllers: [ClientProfileController, ClientBirthdayController],
  providers: [
    PrismaService,
    PrismaSessionRepository,
    PrismaOutboxPublisher,
    PrismaPushTokenRepository,
    PrismaOtpChallengeRepository,
    PrismaUserRepository,
    PrismaBarberPhotoRepository,
    S3PublicMediaStorage,
    PrismaUnitOfWork,
    SystemClock,
    UuidIdGenerator,
    OtpSenderFactory,
    PrismaLoginAudit,
    CrmClientProfilesAdapter,
    ...identityOtpProviders,
    ...identityBarberProviders,
    ...identityAccountProviders,
    ...identitySessionProviders,
    { provide: AdminSessionGuard, useClass: AdminSessionGuard },
    PrismaClientProfileRepository,
  ],
  exports: [PrismaService, PrismaClientProfileRepository, CrmClientProfilesAdapter],
})
export class ProfileRoutingModule {}
