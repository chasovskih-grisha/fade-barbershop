// ManageConsent — клієнт дає/відкликає згоду на AI-генерацію (AI-WEB-02,
// AI-WEB-07). Згода прив'язана до конкретного SourcePhoto і зберігається разом
// із ним (audit: ConsentChanged у outbox). Власник — з сесії, не з тіла запиту.

import { PhotoAlreadyDeletedError, SourcePhotoNotFoundError } from './haircut-errors';
import type { Clock, Outbox, SourcePhotoRepository, UnitOfWork } from '../domain/ports';

export interface GiveConsentInput {
  sourcePhotoId: string;
  ownerId: string;
}

export interface GiveConsentOutput {
  success: true;
  consentGrantedAt: string;
}

export interface RevokeConsentOutput {
  success: true;
}

export interface ConsentDeps {
  photos: SourcePhotoRepository;
  outbox: Outbox;
  clock: Clock;
  uow: UnitOfWork;
}

export class GiveConsentHandler {
  constructor(private readonly deps: ConsentDeps) {}

  async handle(input: GiveConsentInput): Promise<GiveConsentOutput> {
    const { photos, outbox, clock, uow } = this.deps;
    return uow.run(async (): Promise<GiveConsentOutput> => {
      const photo = await ownedPhoto(photos, input.sourcePhotoId, input.ownerId);
      const event = photo.giveConsent(clock);
      if (!event)
        return {
          success: true,
          consentGrantedAt: (photo.consentGrantedAt ?? clock.now()).toISOString(),
        };
      await photos.save(photo);
      await outbox.append([event]);
      return {
        success: true,
        consentGrantedAt: (photo.consentGrantedAt ?? clock.now()).toISOString(),
      };
    });
  }
}

export class RevokeConsentHandler {
  constructor(private readonly deps: ConsentDeps) {}

  async handle(input: GiveConsentInput): Promise<RevokeConsentOutput> {
    const { photos, outbox, clock, uow } = this.deps;
    return uow.run(async (): Promise<RevokeConsentOutput> => {
      const photo = await ownedPhoto(photos, input.sourcePhotoId, input.ownerId);
      const event = photo.revokeConsent(clock);
      if (event) {
        await photos.save(photo);
        await outbox.append([event]);
      }
      return { success: true };
    });
  }
}

/** Фото власника; чуже/відсутнє — те саме «не знайдено» (не підтверджуємо існування). */
async function ownedPhoto(photos: SourcePhotoRepository, sourcePhotoId: string, ownerId: string) {
  const photo = await photos.findById(sourcePhotoId);
  if (!photo || photo.ownerId !== ownerId) throw new SourcePhotoNotFoundError(sourcePhotoId);
  if (photo.isDeleted) throw new PhotoAlreadyDeletedError();
  return photo;
}
