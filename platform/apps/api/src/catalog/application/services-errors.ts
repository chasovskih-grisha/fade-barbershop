export class ServicesError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ServiceNotFoundError extends ServicesError {
  constructor() {
    super('SERVICE_NOT_FOUND', 'Service not found');
  }
}

export class ServiceCodeTakenError extends ServicesError {
  constructor() {
    super('SERVICE_DUPLICATE', 'Service with same name and duration already exists');
  }
}

export class InvalidServiceInputError extends ServicesError {
  constructor(message: string) {
    super('INVALID_SERVICE_INPUT', message);
  }
}
