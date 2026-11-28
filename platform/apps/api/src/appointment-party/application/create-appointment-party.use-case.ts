import { uuidv7 } from '@fade/domain-shared';

import { AppointmentParty, AppointmentMode } from '../domain/appointment-party.entity';
import { PartyLeg } from '../domain/party-leg.entity';
import { AppointmentPartyRepository } from './ports';
import { AppointmentPartyCreated } from '../domain/appointment-party.events';
import { assertAndBuildSlots } from './create-appointment-party-slots';
import { barbersOutsideService } from '../../scheduling/domain/barber-service-matrix';
import type { BarberServiceAssignmentSnapshot } from '../../scheduling/domain/ports.barber-service-assignment';

interface CreateAppointmentPartyInput {
  locationId: string;
  serviceId: string;
  date: Date;
  mode: AppointmentMode;
  barberIds: [string, string];
  // For sequential: one slot of 90 min. For parallel: father 50 min and son 45 min at a shared start.
  slots: { start: Date; end: Date }[];
  partyLegs: { id: string; role: 'father' | 'son'; name: string; age: number; barberId: string }[];
  agreedPriceId: string;
  agreedPrice: number;
}

/**
 * Use‑case: create an appointment party.
 * Validates business rules (PARTY‑003…005).
 */
/** Порт матриці «барбер × послуга»: партія перевіряє його, якщо він підключений. */
export interface PartyServiceMatrixPort {
  snapshotForLocation(locationId: string): Promise<BarberServiceAssignmentSnapshot>;
}

export class CreateAppointmentParty {
  constructor(
    private readonly repo: AppointmentPartyRepository,
    private readonly deps: { matrix?: PartyServiceMatrixPort } = {}
  ) {}

  async execute(input: CreateAppointmentPartyInput): Promise<AppointmentPartyCreated> {
    if (!input.locationId.trim() || !input.serviceId.trim())
      throw new Error('Location and service are required');
    if (!Number.isInteger(input.agreedPrice) || input.agreedPrice <= 0)
      throw new Error('Agreed price must be a positive integer');
    this.assertBarbersForMode(input);
    this.assertLegsMatchBarbers(input);
    await this.assertBarbersPerformService(input);

    const slots = assertAndBuildSlots(input);

    const id = uuidv7();
    const appointmentParty = AppointmentParty.create({
      id,
      locationId: input.locationId,
      serviceId: input.serviceId,
      date: input.date,
      mode: input.mode,
      barberIds: input.barberIds,
      slots,
      partyLegs: input.partyLegs.map((l) => PartyLeg.create(l)),
      agreedPriceId: input.agreedPriceId,
      agreedPrice: input.agreedPrice,
    });

    await this.repo.save(appointmentParty);
    return new AppointmentPartyCreated(appointmentParty);
  }

  // T-4521/T-044: батько і син стоять лише в барберів, які виконують послугу
  // партії в цій локації. Порожня матриця — дефолт «усі» (як у слотах і записі).
  private async assertBarbersPerformService(input: CreateAppointmentPartyInput): Promise<void> {
    if (!this.deps.matrix) return;
    const snapshot = await this.deps.matrix.snapshotForLocation(input.locationId);
    const missing = barbersOutsideService(snapshot.matrix, {
      locationId: input.locationId,
      serviceId: input.serviceId,
      barberIds: input.barberIds,
    });
    if (missing.length > 0)
      throw new Error(`Barber does not perform this service (T-4521): ${missing.join(', ')}`);
  }

  private assertBarbersForMode(input: CreateAppointmentPartyInput): void {
    const [first, second] = input.barberIds;
    if (!first || !second) throw new Error('Barber IDs are required (PARTY-003)');
    if (input.mode === 'parallel' && first === second)
      throw new Error('Parallel mode requires two distinct barbers (PARTY-003)');
    if (input.mode === 'sequential' && first !== second)
      throw new Error('Sequential mode requires one barber (PARTY-003)');
  }

  private assertLegsMatchBarbers(input: CreateAppointmentPartyInput): void {
    if (input.partyLegs.length !== 2) {
      throw new Error('Exactly two party legs are required (PARTY-004)');
    }
    const [b1, b2] = input.barberIds as [string, string];
    if (input.partyLegs[0]?.role !== 'father' || input.partyLegs[1]?.role !== 'son')
      throw new Error('Party legs must be ordered father then son (PARTY-004)');
    const legBarberIds = new Set(input.partyLegs.map((l) => l.barberId));
    const needsTwoBarbers = input.mode === 'parallel';
    if (
      !legBarberIds.has(b1) ||
      !legBarberIds.has(b2) ||
      (needsTwoBarbers && legBarberIds.size !== 2) ||
      (!needsTwoBarbers && legBarberIds.size !== 1)
    ) {
      throw new Error('Party legs must match the barber assignment for their mode (PARTY-004)');
    }
  }
}
