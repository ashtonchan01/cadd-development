export interface AddressCandidate {
  fullAddress: string;
  suburb: string;
  postcode: string;
  lat?: number;
  lon?: number;
}

/**
 * Nominatim (OpenStreetMap) public search API — free, no API key, CORS-enabled
 * for client-side use, results filtered to Australia and re-filtered client-side
 * to NSW postcodes (2000-2999, 1000-1999 non-standard business codes excluded).
 *
 * Coverage/formatting is community-sourced OSM data, so it's not as authoritative
 * as a government address register — this is address-entry convenience, not a
 * source of truth for zoning or lot boundaries. Every call below fails silently
 * on error, so the address field always still works as a plain text input.
 */
const SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

interface NominatimResult {
  display_name: string;
  lat?: string;
  lon?: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    town?: string;
    city?: string;
    postcode?: string;
    state?: string;
  };
}

// Splits "11 Annanvale Circuit" into house number "11" and street "Annanvale Circuit",
// so we can query Nominatim's structured `street` field — free-text queries often
// resolve to street level only and drop the house number from the result entirely.
function splitHouseNumber(query: string): { houseNumber: string; street: string } {
  const match = query.trim().match(/^(\d+[a-zA-Z]?(?:[/-]\d+)?)\s+(.*)$/);
  return match ? { houseNumber: match[1], street: match[2] } : { houseNumber: '', street: query.trim() };
}

export async function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressCandidate[]> {
  if (query.trim().length < 4) return [];

  const { houseNumber, street } = splitHouseNumber(query);

  const params = new URLSearchParams({
    street: houseNumber ? `${houseNumber} ${street}` : street,
    state: 'New South Wales',
    country: 'Australia',
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'au',
    limit: '6',
  });

  try {
    const res = await fetch(`${SEARCH_URL}?${params.toString()}`, { signal });
    if (!res.ok) return [];
    const data: NominatimResult[] = await res.json();

    return data
      .filter((r) => r.address?.state === 'New South Wales' || r.address?.postcode?.match(/^2\d{3}$/))
      .map((r) => {
        const a = r.address ?? {};
        const houseNo = a.house_number || houseNumber;
        const road = a.road || street;
        const suburb = a.suburb ?? a.town ?? a.city ?? '';
        const parts = [houseNo, road].filter(Boolean).join(' ');
        const fullAddress = [parts, suburb, 'NSW', a.postcode].filter(Boolean).join(', ');
        const lat = r.lat ? Number(r.lat) : undefined;
        const lon = r.lon ? Number(r.lon) : undefined;
        return { fullAddress, suburb, postcode: a.postcode ?? '', lat, lon };
      });
  } catch {
    // Network error, aborted request, or the service is unreachable — fail quietly.
    return [];
  }
}
