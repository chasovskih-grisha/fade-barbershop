import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PrismaUnitOfWork } from '../../shared/prisma/prisma-context';
import { SystemClock } from './system-clock';
import { UuidIdGenerator } from './uuid-id-generator';
import { OtpSenderFactory } from './otp-sender.factory';
import { AdminClientOtpController } from './admin-client-otp.controller';
import { RefreshSessionController } from './refresh-session.controller';
import { MobileLogoutController } from './mobile-logout.controller';
import { ClientSessionsController } from './client-sessions.controller';
import { ChangePhoneController } from './change-phone.controller';
import { PushTokensController } from './push-tokens.controller';
import { WebPushSubscriptionController } from './web-push-subscription.controller';
import { ClientProfileController } from './client-profile.controller';
import { ClientBirthdayController } from './client-birthday.controller';
import { AdminAccountController } from './admin-account.controller';
import { PrismaLoginAudit } from './prisma-login-audit';
import { S3PublicMediaStorage } from '../../shared/media/s3-public-media-storage';
import { RateLimitModule } from '../../shared/rate-limit/rate-limit.module';
import { PrismaOtpChallengeRepository, PrismaUserRepository } from './prisma-adapters';
import { PrismaBarberPhotoRepository } from './prisma-barber-photo.repository';
import { BARBER_PHOTO_REPOSITORY } from '../domain/ports.barber-photo';
import { PrismaOutboxPublisher } from './prisma-outbox-publisher';
import { PrismaPushTokenRepository } from './prisma-push-token-repository';
import { PrismaSessionRepository } from './prisma-session-repository';
import { PrismaClientProfileRepository } from '../../crm/infrastructure/prisma-client-profile.repository';
import { CrmClientProfilesAdapter } from './crm-client-profiles.adapter';
import { AdminLoginController } from './admin-login.controller';
import { AdminMeController } from './admin-me.controller';
import { RequestOtpController } from './request-otp.controller';
import { VerifyOtpController } from './verify-otp.controller';
import { LogoutController } from './logout.controller';
import { AdminBarbersController } from './admin-barbers.controller';
import { AdminSessionGuard } from './admin-session.guard';
import { identityOtpProviders } from './identity-otp.providers';
import { identityBarberProviders } from './identity-barber.providers';
import { identityAccountProviders } from './identity-account.providers';
import { identitySessionProviders } from './identity-session.providers';
import { identityChangePhoneProviders } from './identity-change-phone.providers';
import { identityAdminOtpProviders } from './identity-admin-otp.providers';
import { CrmModule } from '../../crm/crm.module';

@Module({
  // CrmModule потрібен заради ADMIN_CLIENTS_HANDLERS: ClientProfileController
  // моститься на CRM-хендлери, а токен провадить і експортує лише CrmModule.
  imports: [RateLimitModule, CrmModule],
  controllers: [
    RequestOtpController,
    VerifyOtpController,
    LogoutController,
    RefreshSessionController,
    MobileLogoutController,
    ClientSessionsController,
    ChangePhoneController,
    PushTokensController,
    WebPushSubscriptionController,
    ClientProfileController,
    ClientBirthdayController,
    AdminLoginController,
    AdminMeController,
    AdminBarbersController,
    AdminClientOtpController,
    AdminAccountController,
  ],

  providers: [
    PrismaService,
    PrismaUnitOfWork,
    SystemClock,
    UuidIdGenerator,
    OtpSenderFactory,
    PrismaUserRepository,
    PrismaBarberPhotoRepository,
    PrismaOtpChallengeRepository,
    PrismaSessionRepository,
    PrismaPushTokenRepository,
    PrismaOutboxPublisher,
    PrismaLoginAudit,
    PrismaClientProfileRepository,
    CrmClientProfilesAdapter,
    S3PublicMediaStorage,
    ...identityOtpProviders,
    ...identityBarberProviders,
    ...identityAccountProviders,
    ...identitySessionProviders,
    ...identityChangePhoneProviders,
    ...identityAdminOtpProviders,
    { provide: APP_GUARD, useClass: AdminSessionGuard },
  ],
  exports: [
    PrismaService,
    PrismaUnitOfWork,
    PrismaUserRepository,
    PrismaBarberPhotoRepository,
    BARBER_PHOTO_REPOSITORY,
  ],
})
export class IdentityModule {}
