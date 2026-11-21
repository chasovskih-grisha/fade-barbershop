// Чисте збирання CSV для адмін-експорту (T-2500f): без Nest/Prisma.

export interface CsvLocation {
  id: string;
  code: string;
  name: string;
  active: boolean;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date | null;
}

export interface CsvClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  locationId: string | null;
}

export interface CsvSetting {
  key: string;
  value: unknown;
  updatedAt: Date | null;
}

function csvRow(values: (string | null | undefined)[]): string {
  return values.map((value) => value ?? '').join(',');
}

function locationSection(locations: CsvLocation[]): string[] {
  const lines = ['=== LOCATIONS ===', 'id,code,name,active,address,phone,email,createdAt'];
  for (const loc of locations) {
    const createdAt = loc.createdAt?.toISOString().replace(/[^\d]/g, '') ?? '';
    lines.push(
      csvRow([
        loc.id,
        loc.code,
        loc.name,
        loc.active ? 'true' : 'false',
        loc.address,
        loc.phone,
        loc.email,
        createdAt,
      ])
    );
  }
  return lines;
}

function clientSection(clients: CsvClient[]): string[] {
  const lines = ['', '=== CLIENTS ===', 'id,name,email,phone,locationId'];
  for (const client of clients) {
    lines.push(csvRow([client.id, client.name, client.email, client.phone, client.locationId]));
  }
  return lines;
}

function settingSection(setting: CsvSetting | null): string[] {
  const lines = ['', '=== DEPOSIT POLICY SETTINGS ===', 'key,value,updatedAt'];
  if (!setting) return [...lines, 'No deposit policy settings found'];
  const raw = typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value);
  lines.push(csvRow([setting.key, raw ?? '', setting.updatedAt?.toISOString()]));
  return lines;
}

export function buildClientsSettingsCsv(
  locations: CsvLocation[],
  clients: CsvClient[],
  setting: CsvSetting | null
): string {
  return [
    ...locationSection(locations),
    ...clientSection(clients),
    ...settingSection(setting),
  ].join('\r\n');
}
