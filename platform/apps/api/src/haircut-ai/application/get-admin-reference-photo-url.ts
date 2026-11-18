// Підписаний URL референсного фото для адмін/барбер-поверхні (REF-BARBER, T-043;
// ADR 0008 §2). Клієнтський маршрут (`GetReferencePhotoUrl`) має ACL
// `ownerId === actorId`, тож адмін і барбер призначеного візиту йдуть своєю
// поверхнею — карткою візиту в адмінці.
//
// Відмінність від клієнтського ACL свідома: фото гостя (ownerId 'anonymous')
// не має власника, якого можна зіставити, але барбер мусить бачити референс
// гостя. Право доступу тут дає роль (глобальний AdminSessionGuard на
// /admin/*), а не володіння фото.
import type { PhotoStorage, SourcePhotoRepository } from '../domain/ports';
import { SIGNED_URL_TTL_SEC } from './ai-read-model';
import { ReferencePhotoNotFoundError, type ReferencePhotoUrl } from './get-reference-photo-url';

export interface GetAdminReferencePhotoUrlDeps {
  photos: SourcePhotoRepository;
  storage: PhotoStorage;
}

export class GetAdminReferencePhotoUrl {
  constructor(private readonly deps: GetAdminReferencePhotoUrlDeps) {}

  async execute(input: { photoId: string }): Promise<ReferencePhotoUrl> {
    const { photos, storage } = this.deps;
    const photo = await photos.findById(input.photoId);
    // М'яко видалене фото недоступне й адміну: клієнт прибрав референс
    // (AI-WEB-07), картка не має показувати те, що видалено.
    if (!photo || photo.isDeleted) throw new ReferencePhotoNotFoundError(input.photoId);
    return {
      url: await storage.signedUrl(photo.objectKey, SIGNED_URL_TTL_SEC),
      contentType: photo.contentType,
      expiresInSeconds: SIGNED_URL_TTL_SEC,
    };
  }
}
