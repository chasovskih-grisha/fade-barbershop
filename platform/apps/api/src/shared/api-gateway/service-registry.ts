/** Internal service registry standing in for gRPC descriptors (T-5003). */

import type { ServiceDescriptor, ServiceMethodDescriptor } from './gateway.types';

export class ServiceRegistry {
  private readonly services = new Map<string, ServiceDescriptor>();

  constructor(descriptors: readonly ServiceDescriptor[] = []) {
    for (const descriptor of descriptors) this.register(descriptor);
  }

  register(descriptor: ServiceDescriptor): void {
    this.services.set(descriptor.name, descriptor);
  }

  list(): readonly ServiceDescriptor[] {
    return [...this.services.values()];
  }

  find(service: string, method: string): ServiceMethodDescriptor | undefined {
    return this.services
      .get(service)
      ?.methods.find((candidate) => candidate.name === method);
  }

  /** Field-level request validation before a service-to-service call. */
  validateRequest(
    service: string,
    method: string,
    payload: Readonly<Record<string, unknown>>
  ): readonly string[] {
    const descriptor = this.find(service, method);
    if (!descriptor) return [`unknown_method:${service}.${method}`];
    const provided = Object.keys(payload);
    const missing = descriptor.requestFields.filter((field) => !provided.includes(field));
    const unknown = provided.filter((field) => !descriptor.requestFields.includes(field));
    return [
      ...missing.map((field) => `missing_field:${field}`),
      ...unknown.map((field) => `unknown_field:${field}`),
    ];
  }
}
