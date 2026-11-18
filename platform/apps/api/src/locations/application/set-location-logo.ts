// SetLocationLogo — завантаження/заміна логотипа локації (T-4609a). Світле
// (milk) поле обов'язкове, темне — опційне; on-dark без on-milk неможливий
// (buildLocationLogo). Старі об'єкти видаляються після успішного збереження;
// невдалий dark-файл відкочує вже завантажений light-об'єкт.
import { uuidv7 } from '@fade/domain-shared';
import { buildLocationLogo, InvalidLocationLogoError } from '../domain/location-logo';
import type { LocationLogo } from '../domain/location-logo';
import type { LocationLogoRepository, LocationRepository, Clock } from '../domain/ports';
import { InvalidLocationInputError, LocationNotFoundError } from './locations-errors';
import { MediaProcessingError, PUBLIC_MEDIA_INPUT_TYPES, type PublicMediaStorage } from '../../shared/media/public-media-storage';

export interface LogoFile {
  bytes: Uint8Array;
  contentType: string;
}

export interface SetLocationLogoInput {
  locationId: string;
  variant: string;
  alt: string;
  light: LogoFile;
  dark?: LogoFile;
}

export interface SetLocationLogoDeps {
  locations: LocationRepository;
  logos: LocationLogoRepository;
  media: PublicMediaStorage;
  clock: Clock;
}

export class SetLocationLogoHandler {
  constructor(private readonly deps: SetLocationLogoDeps) {}

  async handle(input: SetLocationLogoInput): Promise<LocationLogo> {
    const location = await this.deps.locations.findById(input.locationId);
    if (!location) throw new LocationNotFoundError();
    const previous = await this.deps.logos.findByLocationId(input.locationId);
    // Ключ об'єкта в сховищі — теж UUID (ADR 0021): один генератор на систему.
    const prefix = `locations/${input.locationId}/${uuidv7()}`;
    const light = await this.upload(`${prefix}-light`, input.light);
    const dark = input.dark ? await this.uploadRollback(`${prefix}-dark`, input.dark, light) : null;
    const logo = await this.build(input, light.objectKey, dark);
    await this.deps.logos.save(logo);
    if (previous) await this.cleanup(previous);
    return logo;
  }

  /** Валідує тип, кладе в бакет; MediaProcessingError → 400 для клієнта. */
  private async upload(key: string, file: LogoFile) {
    if (!(PUBLIC_MEDIA_INPUT_TYPES as readonly string[]).includes(file.contentType)) {
      throw new InvalidLocationInputError(`Unsupported image type: ${file.contentType}`);
    }
    try {
      return await this.deps.media.put({ bytes: file.bytes, contentType: file.contentType, key });
    } catch (error) {
      if (error instanceof MediaProcessingError) {
        throw new InvalidLocationInputError('Не вдалося обробити зображення');
      }
      throw error;
    }
  }

  /** Темне поле: невдалий upload відкочує вже завантажений light-об'єкт. */
  private async uploadRollback(key: string, file: LogoFile, light: { objectKey: string }) {
    try {
      return await this.upload(key, file);
    } catch (error) {
      await this.discard([light.objectKey]);
      throw error;
    }
  }

  private async build(
    input: SetLocationLogoInput,
    lightKey: string,
    dark: { objectKey: string } | null
  ): Promise<LocationLogo> {
    try {
      return buildLocationLogo({
        locationId: input.locationId,
        variant: input.variant,
        lightKey,
        darkKey: dark?.objectKey ?? null,
        alt: input.alt,
        updatedAt: this.deps.clock.now(),
      });
    } catch (error) {
      await this.discard([lightKey, ...(dark ? [dark.objectKey] : [])]);
      if (error instanceof InvalidLocationLogoError) {
        throw new InvalidLocationInputError(error.message);
      }
      throw error;
    }
  }

  /** Ідемпотентне прибирання об'єктів: помилка прибирання не ламає відповідь. */
  private async discard(keys: string[]): Promise<void> {
    await this.deps.media.remove(keys).catch(() => undefined);
  }

  private async cleanup(previous: LocationLogo): Promise<void> {
    await this.discard([previous.lightKey, ...(previous.darkKey ? [previous.darkKey] : [])]);
  }
}
