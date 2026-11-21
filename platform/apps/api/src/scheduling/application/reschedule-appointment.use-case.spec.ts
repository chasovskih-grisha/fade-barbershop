// Функціональна специфікація RescheduleAppointment (T-4533): той самий запис,
// той самий appointmentId; валідації нового слота; барбер не може переносити;
// завершені/скасовані — заборонено; тривалість незмінна. Mover мокається —
// атомарність перевіряє race-e2e на Postgres.
import {
  RescheduleAppointment,
  type AppointmentTimeMover,
} from './reschedule-appointment.use-case';
import { Appointment, InvalidTransitionError } from '../domain/appointment.aggregate';
import { AppointmentNotFoundError } from './appointment-lifecycle.use-case';
import { BarberSchedule } from '../domain/availability';
import { InvalidSlotError } from '../domain/slot-validator';
import { BookingConflictError } from '../domain/booking';
import {
  T0,
  booked,
  cmd,
  fakeRepo,
  okLocation,
  okMover,
  setup,
} from './reschedule-appointment.fakes';

describe('RescheduleAppointment (T-4533)', () => {
  it('переносить живий запис: той самий id, mover викликається з новим слотом', async () => {
    const { useCase, moves } = setup(booked());
    await useCase.handle(cmd());
    expect(moves).toHaveLength(1);
    // prettier-ignore
    expect(moves[0]).toMatchObject({ appointmentId: 'apt-1', newStart: new Date('2026-11-02T11:00:00.000Z'), newEnd: new Date('2026-11-02T11:30:00.000Z') });
  });

  it('барбер не може переносити', async () => {
    const { useCase, moves } = setup(booked());
    // prettier-ignore
    await expect(useCase.handle(cmd({ actorRole: 'barber', actorId: 'b1' }))).rejects.toThrow('Barber cannot reschedule');
    expect(moves).toHaveLength(0);
  });

  it('невідомий id → AppointmentNotFoundError', async () => {
    const { useCase } = setup(booked());
    // prettier-ignore
    await expect(useCase.handle(cmd({ appointmentId: 'nope' }))).rejects.toBeInstanceOf(AppointmentNotFoundError);
  });

  it('завершений і скасований записи не переносяться', async () => {
    const done = booked();
    done.confirm({}, T0);
    done.startVisit({}, T0);
    done.complete(T0);
    const { useCase: a } = setup(done);
    await expect(a.handle(cmd())).rejects.toBeInstanceOf(InvalidTransitionError);
    const cancelled = booked();
    cancelled.cancel({}, T0);
    const { useCase: b } = setup(cancelled);
    await expect(b.handle(cmd())).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it('пише лише rescheduled: жодного AppointmentCancelled (не скасування)', async () => {
    const { useCase, moves } = setup(booked());
    await useCase.handle(cmd());
    expect(moves[0]?.event?.type).toBe('scheduling.appointment.rescheduled');
    expect(moves[0]?.event?.payload).not.toHaveProperty('reason');
  });

  it('зміна тривалості заборонена', async () => {
    const { useCase, moves } = setup(booked());
    await expect(useCase.handle(cmd({ end: '11:45' }))).rejects.toBeInstanceOf(InvalidSlotError);
    expect(moves).toHaveLength(0);
  });

  it.each([
    ['слот поза графіком барбера', { start: '18:00', end: '18:30' }],
    ['дата не формату YYYY-MM-DD', { date: 'не-дата' }],
    ['неможлива дата (regex проходить, Date невалідна)', { date: '2026-99-99' }],
  ])('%s — InvalidSlotError', async (_name, overrides) => {
    const { useCase } = setup(booked());
    // prettier-ignore
    await expect(useCase.handle(cmd(overrides))).rejects.toBeInstanceOf(InvalidSlotError);
  });

  it('барбер/локація без графіка або неіснуюча локація — InvalidSlotError', async () => {
    const store = new Map<string, Appointment>([['apt-1', booked()]]);
    // prettier-ignore
    const noSchedule = new RescheduleAppointment({ appointments: fakeRepo(store), scheduleRepo: { findByBarberAndLocation: async () => null }, locationRepo: okLocation, mover: okMover() });
    await expect(noSchedule.handle(cmd())).rejects.toBeInstanceOf(InvalidSlotError);
    // prettier-ignore
    const noLocation = new RescheduleAppointment({ appointments: fakeRepo(store), scheduleRepo: { findByBarberAndLocation: async () => BarberSchedule.create({ barberId: 'b', locationId: 'l', windows: [{ dayOfWeek: 0, start: '09:00', end: '17:00' }] }) }, locationRepo: { findById: async () => null }, mover: okMover() });
    await expect(noLocation.handle(cmd())).rejects.toBeInstanceOf(InvalidSlotError);
  });

  it('конфлікт барбера — BookingConflictError з mover, без часткового переносу', async () => {
    const conflictMover: AppointmentTimeMover = {
      // prettier-ignore
      moveTime: async () => { throw new BookingConflictError('Barber is already booked for this slot'); },
    };
    const { useCase } = setup(booked(), conflictMover);
    await expect(useCase.handle(cmd())).rejects.toThrow(BookingConflictError);
  });
});
