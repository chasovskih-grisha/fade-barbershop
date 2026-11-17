// Помилки use cases призначення барберів на локації (T-023, MNG-ADM-06).
// Базовий клас — LocationError, щоб locations-http.mapper нормалізував body.

import { LocationError } from './locations-errors';

// Барбер уже закріплений за цією локацією.
export class StaffAlreadyAssignedError extends LocationError {
  constructor() {
    super('STAFF_ALREADY_ASSIGNED', 'Barber is already assigned to this location');
  }
}

// Призначення немає (або вже зняте) — помилка видалення.
export class StaffAssignmentNotFoundError extends LocationError {
  constructor() {
    super('STAFF_ASSIGNMENT_NOT_FOUND', 'Staff assignment not found');
  }
}

export class InvalidStaffInputError extends LocationError {
  constructor(message: string) {
    super('INVALID_STAFF_INPUT', message);
  }
}
