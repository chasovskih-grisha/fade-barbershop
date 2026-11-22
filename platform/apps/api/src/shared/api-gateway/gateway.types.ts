/** Edge-gateway contract vocabulary: GraphQL selections and gRPC descriptors (T-5003). */

export type FieldType = 'string' | 'number' | 'boolean' | 'object';

export interface FieldDefinition {
  readonly name: string;
  readonly type: FieldType;
  /** Object type name when `type` is 'object'. */
  readonly of?: string;
}

export interface ObjectType {
  readonly name: string;
  readonly fields: readonly FieldDefinition[];
}

export interface GraphqlSchema {
  readonly types: readonly ObjectType[];
}

export interface Selection {
  readonly field: string;
  readonly children?: readonly Selection[];
}

export interface ProjectionError {
  readonly path: string;
  readonly message: string;
}

export interface ServiceMethodDescriptor {
  readonly name: string;
  readonly requestFields: readonly string[];
  readonly responseFields: readonly string[];
}

export interface ServiceDescriptor {
  readonly name: string;
  readonly methods: readonly ServiceMethodDescriptor[];
}

export interface GatewayResult {
  readonly data: Readonly<Record<string, unknown>>;
  readonly errors: readonly ProjectionError[];
  readonly elapsedMs: number;
  readonly withinLatencyBudget: boolean;
}
