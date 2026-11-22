/** Self-service GDPR/CCPA data export bundle (T-5015). */

export interface ClientDataExportInput {
  readonly clientId: string;
  readonly generatedAt: Date;
  readonly profile: Readonly<Record<string, unknown>>;
  readonly appointments: readonly Readonly<Record<string, unknown>>[];
  readonly payments: readonly Readonly<Record<string, unknown>>[];
  readonly messages: readonly Readonly<Record<string, unknown>>[];
  readonly consents: readonly Readonly<Record<string, unknown>>[];
}

export interface ClientDataExport {
  readonly schemaVersion: '1.0';
  readonly clientId: string;
  readonly generatedAt: Date;
  readonly sections: {
    readonly profile: Readonly<Record<string, unknown>>;
    readonly appointments: readonly Readonly<Record<string, unknown>>[];
    readonly payments: readonly Readonly<Record<string, unknown>>[];
    readonly messages: readonly Readonly<Record<string, unknown>>[];
    readonly consents: readonly Readonly<Record<string, unknown>>[];
  };
  readonly counts: Readonly<Record<string, number>>;
}

/** Assembles the portable archive; serialization to JSON/CSV is the adapter's job. */
export function buildClientDataExport(input: ClientDataExportInput): ClientDataExport {
  return {
    schemaVersion: '1.0',
    clientId: input.clientId,
    generatedAt: input.generatedAt,
    sections: {
      profile: input.profile,
      appointments: input.appointments,
      payments: input.payments,
      messages: input.messages,
      consents: input.consents,
    },
    counts: {
      appointments: input.appointments.length,
      payments: input.payments.length,
      messages: input.messages.length,
      consents: input.consents.length,
    },
  };
}
