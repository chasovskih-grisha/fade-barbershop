// Публічна віддача фото барбера (T-4610b, Done T-4610): `photo` у відповіді
// `GET /booking/barbers/{locationId}` — лише для активних барберів цієї локації
// і лише за наявності згоди (ADR 0015). Без згоди/без фото — null, картка
// фолбекається на Avatar з ініціалами (T-4507d). «Будь-який барбер» — без фото.
import { BookingReader } from './booking.reader';
import { createLocation } from '../../locations/test-helpers.fakes';
import { User } from '../../identity/domain/user';
import { PhoneNumber } from '../../identity/domain/phone-number';
import { MemPublicMediaStorage } from '../../shared/media/public-media-storage.fakes';
import type { BarberPhoto } from '../../identity/domain/barber-photo';

const T0 = new Date('2026-11-12T10:00:00.000Z');

function barber(id: string, active = true): User {
  return User.create({
    id,
    phone: PhoneNumber.of('+380501234567'),
    role: 'barber',
    name: id,
    active,
    createdAt: T0,
  });
}

function photo(userId: string, consentAt: Date | null): BarberPhoto {
  return {
    userId,
    objectKey: `barbers/${userId}/photo`,
    alt: `Фото ${userId}`,
    width: 512,
    height: 512,
    consentAt,
    consentBy: consentAt ? 'admin-1' : null,
    updatedAt: T0,
  };
}

function makeReader(photosByUser: Map<string, BarberPhoto>) {
  const media = new MemPublicMediaStorage();
  const reader = new BookingReader({
    locationRepo: { findById: async () => createLocation({ id: 'loc-1' }) } as never,
    userRepo: { listByRole: async () => [barber('b1'), barber('b2'), barber('b3')] } as never,
    serviceRepo: {} as never,
    staffAssignments: {
      listByLocation: async () => [{ barberId: 'b1' }, { barberId: 'b2' }, { barberId: 'b3' }],
    } as never,
    photos: { findByUserId: async (id: string) => photosByUser.get(id) ?? null } as never,
    media,
  });
  return { reader, media };
}

describe('BookingReader.listBarbers — public barber photo (T-4610b)', () => {
  it('публікує фото лише за наявності згоди (consentAt)', async () => {
    const photos = new Map<string, BarberPhoto>([
      ['b1', photo('b1', T0)],
      ['b2', photo('b2', null)],
    ]);
    const { reader } = makeReader(photos);

    const listed = await reader.listBarbers('loc-1');

    const withConsent = listed.find((b) => b.id === 'b1');
    const withoutConsent = listed.find((b) => b.id === 'b2');
    expect(withConsent?.photo).toMatchObject({ alt: 'Фото b1', width: 512, height: 512 });
    expect(withConsent?.photo?.url).toContain('b1');
    expect(withoutConsent?.photo).toBeNull();
  });

  it('барбер без фото → photo: null (фолбек на ініціали на клієнті)', async () => {
    const { reader } = makeReader(new Map());

    const listed = await reader.listBarbers('loc-1');

    expect(listed.find((b) => b.id === 'b3')?.photo).toBeNull();
  });

  it('«Будь-який барбер» — перша опція без фото', async () => {
    const { reader } = makeReader(new Map([['b1', photo('b1', T0)]]));

    const listed = await reader.listBarbers('loc-1');

    expect(listed[0]).toMatchObject({ id: '', any: true });
    expect(listed[0]?.photo).toBeUndefined();
  });

  it('деактивований барбер не потрапляє у публічний список', async () => {
    const media = new MemPublicMediaStorage();
    const reader = new BookingReader({
      locationRepo: { findById: async () => createLocation({ id: 'loc-1' }) } as never,
      userRepo: { listByRole: async () => [barber('b1'), barber('inactive', false)] } as never,
      serviceRepo: {} as never,
      staffAssignments: {
        listByLocation: async () => [{ barberId: 'b1' }, { barberId: 'inactive' }],
      } as never,
      photos: { findByUserId: async () => null } as never,
      media,
    });

    const listed = await reader.listBarbers('loc-1');

    expect(listed.map((b) => b.id)).toEqual(['', 'b1']);
  });
});
