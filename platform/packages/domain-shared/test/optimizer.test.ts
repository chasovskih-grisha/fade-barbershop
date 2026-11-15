import { RECOMMENDED_INDICES, generateIndexCreationSQL } from '../src/db/optimizer';

describe('Database Schema Optimizer', () => {
  it('defines recommended indexes for performance', () => {
    expect(RECOMMENDED_INDICES.length).toBeGreaterThan(0);
    const sql = generateIndexCreationSQL();
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_appointments_barber_date');
    expect(sql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_phone_email');
  });
});
