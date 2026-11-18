import { Address } from '../domain/address';
import { Location } from '../domain/location';
import { Coordinates } from '../domain/coordinates';
import { OpeningHours } from '../domain/opening-hours';
import { Chair } from '../domain/chair';
import { normalizeChannels } from '../domain/location-channel';
import { normalizePhotos } from '../domain/location-photo';
import { HoursChanged, ChairUpdated, ChannelsChanged, PhotosChanged } from '../domain/location.events';
import type { DayHours } from '../domain/opening-hours';
import type { ChairData } from '../domain/chair';
import { InvalidLocationInputError } from './locations-errors';
import type { UpdateLocationInput } from './update-location';

function guard<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    throw new InvalidLocationInputError((error as Error).message);
  }
}

export function applyLocationChanges(location: Location, input: UpdateLocationInput): boolean {
  let changed = false;
  const steps = [
    () => applyProfile(location, input),
    () => (input.active !== undefined ? location.setActive(input.active) : false),
    () => (input.hours ? applyHours(location, input.hours) : false),
    () => (input.chairs ? applyChairs(location, input.chairs) : false),
    () => (input.channels ? applyChannels(location, input.channels) : false),
    () => (input.photos ? applyPhotos(location, input.photos) : false),
  ];
  for (const step of steps) if (step()) changed = true;
  return changed;
}

function applyProfile(location: Location, input: UpdateLocationInput): boolean {
  const parts = input.addressParts;
  return guard(() =>
    location.updateProfile({
      name: input.name,
      address: input.address,
      addressParts: parts ? Address.of(parts) : undefined,
      coordinates: coordinates(input),
      phone: input.phone,
      email: input.email,
    })
  );
}

function coordinates(input: UpdateLocationInput): Coordinates | undefined {
  const { lat, lng } = input;
  if (lat === undefined || lng === undefined) return undefined;
  return guard(() => Coordinates.of(lat, lng));
}

function applyHours(location: Location, hours: DayHours[]): boolean {
  return guard(() => location.setHours(OpeningHours.of(hours)));
}

function applyChairs(location: Location, chairs: ChairData[]): boolean {
  return guard(() => location.setChairs(chairs.map((c) => Chair.of(c.number, c.name, c.active))));
}

function applyChannels(
  location: Location,
  channels: { channel: string; value: string; sortOrder?: number }[]
): boolean {
  return guard(() => location.setChannels(normalizeChannels(channels)));
}

function applyPhotos(
  location: Location,
  photos: { url: string; caption?: string | null; sortOrder?: number }[]
): boolean {
  return guard(() => location.setPhotos(normalizePhotos(photos)));
}

export function locationUpdateEvents(
  location: Location,
  input: UpdateLocationInput,
  now: Date
): (HoursChanged | ChairUpdated | ChannelsChanged | PhotosChanged)[] {
  const events: (HoursChanged | ChairUpdated | ChannelsChanged | PhotosChanged)[] = [];
  if (input.hours) events.push(new HoursChanged(location.id, now));
  if (input.chairs)
    for (const chair of location.chairs)
      events.push(new ChairUpdated(location.id, chair.number, now));
  if (input.channels) events.push(new ChannelsChanged(location.id, now));
  if (input.photos) events.push(new PhotosChanged(location.id, now));
  return events;
}
