// Клієнт адмінських геокодер-ендпоінтів (T-4405). Помилка провайдера не
// блокує форму — просто немає підказок.

export interface AddressPartsValue {
  street: string;
  building: string;
  city: string;
  postalCode?: string;
  country?: string;
}

export interface GeocodeSuggestion {
  label: string;
  lat: number;
  lng: number;
  addressParts: AddressPartsValue;
}

export async function searchAddress(query: string): Promise<GeocodeSuggestion[]> {
  const response = await fetch(
    `/admin/locations/geocode/search?q=${encodeURIComponent(query.trim())}`,
    { credentials: 'include' }
  );
  if (!response.ok) return [];
  return (await response.json()) as GeocodeSuggestion[];
}

export async function reverseAddress(lat: number, lng: number): Promise<AddressPartsValue | null> {
  const response = await fetch(
    `/admin/locations/geocode/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
    { credentials: 'include' }
  );
  if (!response.ok) return null;
  return (await response.json()) as AddressPartsValue | null;
}
