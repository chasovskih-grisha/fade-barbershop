// Location — агрегат context locations (MNG-ADM-01..04): профіль, статус,
// 2 крісла, 7 днів годин. Code — унікальний, upper-case.

import type { Address } from './address';
import { OpeningHours } from './opening-hours';
import { Chair } from './chair';
import type { ChannelData } from './location-channel';
import type { PhotoData } from './location-photo';
import { applyActive, applyChannels, applyChairs, applyHours, applyPhotos, applyProfilePatch } from './location.mutations';
import { createLocationData } from './location.create';
import type { CreateLocationInput, LocationData, LocationProfilePatch } from './location.types';

export type { CreateLocationInput, LocationData } from './location.types';

export class Location {
  private constructor(private readonly data: LocationData) {}

  static create(input: CreateLocationInput): Location {
    return new Location(createLocationData(input));
  }

  static reconstitute(data: LocationData): Location {
    return new Location(data);
  }

  get id(): string {
    return this.data.id;
  }
  get code(): string {
    return this.data.code;
  }
  get name(): string {
    return this.data.name;
  }
  get address(): string {
    return this.data.address;
  }
  get addressParts(): Address | null {
    return this.data.addressParts;
  }
  get lat(): number {
    return this.data.lat;
  }
  get lng(): number {
    return this.data.lng;
  }
  get phone(): string | null {
    return this.data.phone;
  }
  get email(): string | null {
    return this.data.email;
  }
  get active(): boolean {
    return this.data.active;
  }
  get chairs(): readonly Chair[] {
    return this.data.chairs;
  }
  get channels(): readonly ChannelData[] {
    return this.data.channels;
  }
  get photos(): readonly PhotoData[] {
    return this.data.photos;
  }
  get hours(): OpeningHours {
    return this.data.hours;
  }
  get createdAt(): Date {
    return this.data.createdAt;
  }

  updateProfile(input: LocationProfilePatch): boolean {
    return applyProfilePatch(this.data, input);
  }

  setActive(active: boolean): boolean {
    return applyActive(this.data, active);
  }

  setChannels(channels: ChannelData[]): boolean {
    return applyChannels(this.data, channels);
  }

  setPhotos(photos: PhotoData[]): boolean {
    return applyPhotos(this.data, photos);
  }

  setHours(hours: OpeningHours): boolean {
    return applyHours(this.data, hours);
  }

  setChairs(chairs: Chair[]): boolean {
    return applyChairs(this.data, chairs);
  }
}
