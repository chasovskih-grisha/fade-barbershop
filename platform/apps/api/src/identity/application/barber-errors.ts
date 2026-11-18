// Помилки use cases управління барберами (T-023). Код мапається на HTTP у mapper.

import { IdentityError } from './identity-errors';

// Барбера немає (або немає User з роллю barber за id).
export class BarberNotFoundError extends IdentityError {
  constructor() {
    super('BARBER_NOT_FOUND', 'Barber not found');
  }
}

// Телефон уже належить іншому User (MNG-ADM-05: «Телефон уже зайнятий»).
export class BarberPhoneTakenError extends IdentityError {
  constructor() {
    super('BARBER_PHONE_TAKEN', 'Phone already belongs to another user');
  }
}

export class InvalidBarberInputError extends IdentityError {
  constructor(message: string) {
    super('INVALID_BARBER_INPUT', message);
  }
}
