export interface AddressCandidate {
  fullAddress: string;
  suburb: string;
  postcode: string;
}

/**
 * NSW Government's SIX Maps geocoder — a free, public, no-API-key ArcGIS locator
 * service run by NSW Spatial Services. It's used for predictive address search
 * across all of NSW (not just a hand-picked list), which is why this hits the
 * network on every keystroke rather than shipping a bundled address database —
 * there's no practical way to ship "all NSW addresses" client-side.
 *
 * This endpoint wasn't reachable to test from the build sandbox (no outbound
 * network there), so it's only verified to work from a real browser session.
 * If NSW ever change or retire it, every call below fails silently and the
 * address field just behaves like a normal text input — it never blocks typing
 * or submitting the form.
 */
const GEOCODER_URL =
  'https://maps.six.nsw.gov.au/arcgis/rest/services/sixmaps/LPI_GeocodedAddress/GeocodeServer/findAddressCandidates';

export async function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressCandidate[]> {
  if (query.trim().length < 4) return [];

  const params = new URLSearchParams({
    SingleLine: query,
    f: 'json',
    maxLocations: '6',
    outFields: 'HouseNumber,StreetName,StreetType,Suburb,Postcode',
  });

  try {
    const res = await fetch(`${GEOCODER_URL}?${params.toString()}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const candidates = Array.isArray(data?.candidates) ? data.candidates : [];

    return candidates
      .map((c: { address?: string; attributes?: Record<string, string> }) => {
        const attrs = c.attributes ?? {};
        return {
          fullAddress: c.address ?? '',
          suburb: attrs.Suburb ?? '',
          postcode: attrs.Postcode ?? '',
        };
      })
      .filter((c: AddressCandidate) => c.fullAddress);
  } catch {
    // Network error, aborted request, or the service is unreachable — fail quietly.
    return [];
  }
}
