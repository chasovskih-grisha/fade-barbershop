// Помилки use cases context locations. Код мапається на HTTP у контролері.

export class LocationError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

// Код локації вже зайнятий (MNG-ADM-01: «Код уже зайнятий»).
export class LocationCodeTakenError extends LocationError {
  constructor() {
    super('LOCATION_CODE_TAKEN', 'Location code already taken');
  }
}

export class LocationNotFoundError extends LocationError {
  constructor() {
    super('LOCATION_NOT_FOUND', 'Location not found');
  }
}

export class InvalidLocationInputError extends LocationError {
  constructor(message: string) {
    super('INVALID_LOCATION_INPUT', message);
  }
}
