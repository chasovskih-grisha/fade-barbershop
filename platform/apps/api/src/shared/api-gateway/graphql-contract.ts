/** GraphQL contract for the mobile/web edge: validate selection, project payload (T-5003). */

import type {
  GraphqlSchema,
  ObjectType,
  ProjectionError,
  Selection,
} from './gateway.types';

const MAX_SELECTION_DEPTH = 5;

/** Booking slice of the gateway schema; payments are reachable from a booking. */
export const BOOKING_SCHEMA: GraphqlSchema = {
  types: [
    {
      name: 'Booking',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'start', type: 'string' },
        { name: 'priceMinor', type: 'number' },
        { name: 'client', type: 'object', of: 'Client' },
        { name: 'barber', type: 'object', of: 'Barber' },
        { name: 'payment', type: 'object', of: 'Payment' },
      ],
    },
    {
      name: 'Client',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'firstName', type: 'string' },
        { name: 'phone', type: 'string' },
      ],
    },
    {
      name: 'Barber',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'displayName', type: 'string' },
        { name: 'tier', type: 'string' },
      ],
    },
    {
      name: 'Payment',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'amountMinor', type: 'number' },
        { name: 'status', type: 'string' },
      ],
    },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export class GraphqlContract {
  constructor(private readonly schema: GraphqlSchema = BOOKING_SCHEMA) {}

  project(root: string, value: Readonly<Record<string, unknown>>, selection: readonly Selection[]): Record<string, unknown> {
    return this.projectValue(root, value, selection);
  }

  validate(root: string, selection: readonly Selection[]): readonly ProjectionError[] {
    return this.validateAgainst(root, selection, { depth: 0, path: root });
  }

  private type(typeName: string): GraphqlSchema['types'][number] | undefined {
    return this.schema.types.find((candidate) => candidate.name === typeName);
  }

  private validateAgainst(typeName: string, selection: readonly Selection[], depthPath: { depth: number; path: string }): ProjectionError[] {
    const { depth, path } = depthPath;
    if (depth > MAX_SELECTION_DEPTH) return [{ path, message: 'selection_too_deep' }];
    const schemaType = this.type(typeName);
    if (!schemaType) return [{ path, message: `unknown_type:${typeName}` }];
    return selection.flatMap(item => this.validateField(schemaType, item, { depth, path }));
  }

  private validateField(type: ObjectType, selection: Selection, depthPath: { depth: number; path: string }): ProjectionError[] {
    const { depth, path } = depthPath;
    const field = type.fields.find((candidate: { name: string }) => candidate.name === selection.field);
    const fieldPath = `${path}.${selection.field}`;
    if (!field) return [{ path: fieldPath, message: 'unknown_field' }];
    if (field.type !== 'object') return selection.children?.length ? [{ path: fieldPath, message: 'leaf_cannot_have_selection' }] : [];
    if (!field.of) return [{ path: fieldPath, message: 'missing_object_type' }];
    return this.validateAgainst(field.of, selection.children ?? [], { depth: depth + 1, path: fieldPath });
  }

  private projectValue(typeName: string, value: Readonly<Record<string, unknown>>, selection: readonly Selection[]): Record<string, unknown> {
    const schemaType = this.type(typeName);
    if (!schemaType) return {};
    const projected: Record<string, unknown> = {};
    for (const item of selection) {
      const field = schemaType.fields.find((candidate: { name: string }) => candidate.name === item.field);
      if (!field) continue;
      projected[item.field] = this.projectField(field, value[item.field], item.children ?? []);
    }
    return projected;
  }

  private projectField(field: ObjectType['fields'][number], raw: unknown, children: readonly Selection[]): unknown {
    if (field.type !== 'object') return raw ?? null;
    if (raw === null || raw === undefined) return null;
    const objectType = field.of ?? '';
    if (Array.isArray(raw)) return raw.map(item => isRecord(item) ? this.projectValue(objectType, item, children) : null);
    return isRecord(raw) ? this.projectValue(objectType, raw, children) : null;
  }
}