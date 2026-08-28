export interface AddressCandidate {
  fullAddress: string;
  suburb: string;
  postcode: string;
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

export async function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressCandidate[]> {
  if (query.trim().length < 4) return [];

  const params = new URLSearchParams({
    q: `${query}, NSW, Australia`,
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
        return {
          fullAddress: r.display_name,
          suburb: a.suburb ?? a.town ?? a.city ?? '',
          postcode: a.postcode ?? '',
        };
      });
  } catch {
    // Network error, aborted request, or the service is unreachable — fail quietly.
    return [];
  }
}
