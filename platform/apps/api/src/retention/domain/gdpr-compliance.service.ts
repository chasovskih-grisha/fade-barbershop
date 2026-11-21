export interface ClientDataRecord {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  appointments: Array<{ id: string; service: string; date: string; amountPaid: number }>;
  crmNotes: Array<{ id: string; note: string; createdAt: string }>;
  chatLogs: Array<{ id: string; message: string; timestamp: string }>;
  createdAt: string;
}

export class GdprComplianceService {
  private records: Map<string, ClientDataRecord> = new Map();
  private retentionDays: number = 365;

  public registerClientData(record: ClientDataRecord): void {
    this.records.set(record.clientId, record);
  }

  public generateDsarExport(clientId: string): {
    encryptedArchive: string;
    expiresAt: string;
    data: ClientDataRecord;
  } {
    const record = this.records.get(clientId);
    if (!record) {
      throw new Error(`Client ${clientId} not found for DSAR export`);
    }
    const exportPayload = { ...record };
    // Simulated encryption & 1-hour expiration
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    const encryptedArchive = Buffer.from(JSON.stringify(exportPayload)).toString('base64');
    return { encryptedArchive, expiresAt, data: exportPayload };
  }

  public anonymizeClientData(clientId: string): ClientDataRecord {
    const record = this.records.get(clientId);
    if (!record) {
      throw new Error(`Client ${clientId} not found for anonymization`);
    }

    // Scrub PII while preserving transactional accounting integrity (e.g. amountPaid kept)
    const anonymized: ClientDataRecord = {
      clientId: record.clientId,
      name: 'DELETED_USER',
      email: `deleted_${record.clientId}@anonymized.local`,
      phone: '+00000000000',
      appointments: record.appointments.map((app) => ({
        ...app,
        // preserve amountPaid for accounting integrity
      })),
      crmNotes: [],
      chatLogs: [],
      createdAt: record.createdAt,
    };

    this.records.set(clientId, anonymized);
    return anonymized;
  }

  public purgeExpiredRecords(currentDate: Date = new Date()): string[] {
    const purgedIds: string[] = [];
    for (const [clientId, record] of this.records.entries()) {
      const createdDate = new Date(record.createdAt);
      const diffDays = (currentDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays > this.retentionDays) {
        this.anonymizeClientData(clientId);
        purgedIds.push(clientId);
      }
    }
    return purgedIds;
  }
}
