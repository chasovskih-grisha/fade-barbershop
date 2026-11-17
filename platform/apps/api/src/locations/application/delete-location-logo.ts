// DeleteLocationLogo — видалення логотипа локації (T-4609a). Ідемпотентно:
// без логотипа — тихий успіх; прибирання об'єктів не ламає відповідь.
import type { LocationLogoRepository } from '../domain/ports';
import type { PublicMediaStorage } from '../../shared/media/public-media-storage';

export class DeleteLocationLogoHandler {
  constructor(
    private readonly deps: { logos: LocationLogoRepository; media: PublicMediaStorage }
  ) {}

  async handle(locationId: string): Promise<void> {
    const logo = await this.deps.logos.findByLocationId(locationId);
    if (!logo) return;
    await this.deps.logos.delete(locationId);
    const keys = [logo.lightKey, ...(logo.darkKey ? [logo.darkKey] : [])];
    await this.deps.media.remove(keys).catch(() => undefined);
  }
}
