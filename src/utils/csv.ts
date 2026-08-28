import type { NewProperty, ZoneCode } from '../types';
import { ZONE_OPTIONS } from '../data/nswZoning';

const HEADERS = [
  'address', 'suburb', 'lga', 'zone', 'lotSizeSqm', 'frontageM',
  'currentDwellings', 'councilMinLotSqm', 'inHousingSeppCatchment', 'price', 'notes', 'sourceUrl',
] as const;

export const CSV_TEMPLATE = HEADERS.join(',') + '\n' +
  '12 Example St,Parramatta,City of Parramatta,R3,650,15,1,,true,950000,,\n';

export function parseCsv(text: string): { rows: NewProperty[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], errors: ['Empty file'] };

  const header = lines[0].split(',').map((h) => h.trim());
  const rows: NewProperty[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');
    const get = (name: string) => {
      const idx = header.indexOf(name);
      return idx >= 0 ? (cells[idx] ?? '').trim() : '';
    };

    const address = get('address');
    if (!address) { errors.push(`Row ${i + 1}: missing address, skipped`); continue; }

    const zoneRaw = get('zone').toUpperCase() as ZoneCode;
    const zone = ZONE_OPTIONS.includes(zoneRaw) ? zoneRaw : 'OTHER';
    if (zoneRaw && zone === 'OTHER' && zoneRaw !== 'OTHER') {
      errors.push(`Row ${i + 1}: unrecognised zone "${zoneRaw}", set to OTHER`);
    }

    rows.push({
      address,
      suburb: get('suburb'),
      lga: get('lga'),
      zone,
      lotSizeSqm: Number(get('lotSizeSqm')) || 0,
      frontageM: get('frontageM') ? Number(get('frontageM')) : undefined,
      currentDwellings: Number(get('currentDwellings')) || 0,
      councilMinLotSqm: get('councilMinLotSqm') ? Number(get('councilMinLotSqm')) : undefined,
      inHousingSeppCatchment: get('inHousingSeppCatchment').toLowerCase() === 'true',
      price: get('price') ? Number(get('price')) : undefined,
      notes: get('notes') || undefined,
      sourceUrl: get('sourceUrl') || undefined,
    });
  }

  return { rows, errors };
}
