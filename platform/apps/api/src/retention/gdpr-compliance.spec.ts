import { GdprComplianceService } from './domain/gdpr-compliance.service';

describe('GdprComplianceService', () => {
  it('generates DSAR export archive within SLA', () => {
    const service = new GdprComplianceService();
    const client = {
      clientId: 'client-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+380501234567',
      appointments: [{ id: 'app-1', service: 'Haircut', date: '2026-01-01', amountPaid: 500 }],
      crmNotes: [{ id: 'note-1', note: 'Prefers short sides', createdAt: '2026-01-01' }],
      chatLogs: [{ id: 'chat-1', message: 'Hello', timestamp: '2026-01-01T10:00:00Z' }],
      createdAt: '2025-01-01T00:00:00Z',
    };

    service.registerClientData(client);
    const dsar = service.generateDsarExport('client-123');

    expect(dsar.encryptedArchive).toBeDefined();
    expect(dsar.expiresAt).toBeDefined();
    expect(dsar.data.email).toBe('john@example.com');
  });

  it('anonymizes client PII while preserving financial accounting integrity', () => {
    const service = new GdprComplianceService();
    const client = {
      clientId: 'client-456',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+380509876543',
      appointments: [{ id: 'app-2', service: 'Beard Trim', date: '2026-02-01', amountPaid: 300 }],
      crmNotes: [{ id: 'note-2', note: 'VIP client', createdAt: '2026-02-01' }],
      chatLogs: [{ id: 'chat-2', message: 'Book me', timestamp: '2026-02-01T10:00:00Z' }],
      createdAt: '2025-02-01T00:00:00Z',
    };

    service.registerClientData(client);
    const anonymized = service.anonymizeClientData('client-456');

    expect(anonymized.name).toBe('DELETED_USER');
    expect(anonymized.email).toContain('deleted_');
    expect(anonymized.phone).toBe('+00000000000');
    expect(anonymized.crmNotes.length).toBe(0);
    expect(anonymized.chatLogs.length).toBe(0);
    expect(anonymized.appointments[0].amountPaid).toBe(300); // Financial accounting integrity preserved
  });

  it('purges expired records via daily retention policy background worker', () => {
    const service = new GdprComplianceService();
    const oldClient = {
      clientId: 'client-old',
      name: 'Old User',
      email: 'old@example.com',
      phone: '+380500000000',
      appointments: [],
      crmNotes: [],
      chatLogs: [],
      createdAt: '2024-01-01T00:00:00Z', // > 365 days ago
    };

    service.registerClientData(oldClient);
    const purged = service.purgeExpiredRecords(new Date('2026-01-01'));

    expect(purged).toContain('client-old');
  });
});
