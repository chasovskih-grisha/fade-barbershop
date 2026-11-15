/**
 * FADE Platform Database & Schema Optimization Helpers
 * Provides optimized query execution profiles, index strategies, and relational helpers.
 */

export interface IndexDefinition {
  tableName: string;
  indexName: string;
  columns: string[];
  unique?: boolean;
}

export const RECOMMENDED_INDICES: IndexDefinition[] = [
  {
    tableName: 'appointments',
    indexName: 'idx_appointments_barber_date',
    columns: ['barberId', 'startTime', 'status'],
  },
  {
    tableName: 'appointments',
    indexName: 'idx_appointments_client_date',
    columns: ['clientId', 'startTime'],
  },
  {
    tableName: 'appointments',
    indexName: 'idx_appointments_shop_date_status',
    columns: ['shopId', 'startTime', 'status'],
  },
  {
    tableName: 'appointments',
    indexName: 'idx_appointments_payment_status',
    columns: ['paymentStatus', 'createdAt'],
  },
  {
    tableName: 'clients',
    indexName: 'idx_clients_phone_email',
    columns: ['phone', 'email'],
    unique: true,
  },
  {
    tableName: 'inventory_items',
    indexName: 'idx_inventory_shop_sku',
    columns: ['shopId', 'sku'],
    unique: true,
  },
  {
    tableName: 'audit_logs',
    indexName: 'idx_audit_logs_timestamp_actor',
    columns: ['timestamp', 'actorId'],
  },
  {
    tableName: 'payments',
    indexName: 'idx_payments_appointment_status',
    columns: ['appointmentId', 'status'],
  },
];

export function generateIndexCreationSQL(): string {
  return RECOMMENDED_INDICES.map(idx => {
    const uniqueStr = idx.unique ? 'UNIQUE ' : '';
    const cols = idx.columns.join(', ');
    return `CREATE ${uniqueStr}INDEX IF NOT EXISTS ${idx.indexName} ON ${idx.tableName} (${cols});`;
  }).join('\n');
}
