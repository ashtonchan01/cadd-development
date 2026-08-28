import type { ZoneCode } from '../types';
import { ZONE_OPTIONS } from '../data/nswZoning';

export interface PlanningLookupResult {
  zone?: ZoneCode;
  lga?: string;
  councilMinLotSqm?: number;
}

/**
 * NSW Department of Planning's public "EPI Primary Planning Layers" ArcGIS
 * MapServer — the same spatial layers that back the NSW Planning Portal's own
 * map viewer (Land Zoning Mapping, Minimum Lot Size Mapping, LGA boundaries).
 * No API key, free to query via the standard ArcGIS "identify" operation.
 *
 * Like the address geocoder, this couldn't be tested from the build sandbox
 * (no outbound network there) — the exact layer names/field names are best
 * effort from public documentation and may need a follow-up fix once tried
 * against a real address, the same way the geocoder did. Every call fails
 * silently: if it errors, times out, or the response shape doesn't match what
 * we expect, the form fields just stay manually editable.
 */
const IDENTIFY_URL =
  'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/identify';

interface IdentifyResult {
  layerName: string;
  attributes: Record<string, string | number>;
}

function firstAttr(attrs: Record<string, string | number>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = attrs[k];
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return undefined;
}

export async function lookupPlanningControls(lat: number, lon: number, signal?: AbortSignal): Promise<PlanningLookupResult> {
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    sr: '4326',
    layers: 'all',
    tolerance: '2',
    mapExtent: `${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}`,
    imageDisplay: '600,550,96',
    returnGeometry: 'false',
    f: 'json',
  });

  try {
    const res = await fetch(`${IDENTIFY_URL}?${params.toString()}`, { signal });
    if (!res.ok) return {};
    const data: { results?: IdentifyResult[] } = await res.json();
    const results = data.results ?? [];

    const result: PlanningLookupResult = {};

    const zoningLayer = results.find((r) => /zon/i.test(r.layerName));
    if (zoningLayer) {
      const code = firstAttr(zoningLayer.attributes, ['SYM_CODE', 'ZONE', 'LAY_CLASS', 'ZoneCode']);
      const normalized = code?.toUpperCase().trim();
      if (normalized && (ZONE_OPTIONS as string[]).includes(normalized)) {
        result.zone = normalized as ZoneCode;
      }
      const lga = firstAttr(zoningLayer.attributes, ['LGA_NAME', 'LGA', 'COUNCIL']);
      if (lga) result.lga = lga;
    }

    const lotSizeLayer = results.find((r) => /lot\s*size/i.test(r.layerName));
    if (lotSizeLayer) {
      const size = firstAttr(lotSizeLayer.attributes, ['LOT_SIZE', 'MIN_LOT_SIZE', 'LotSize']);
      if (size) {
        const n = Number(size);
        if (!Number.isNaN(n) && n > 0) result.councilMinLotSqm = n;
      }
    }

    return result;
  } catch {
    return {};
  }
}
