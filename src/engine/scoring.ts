import { ZONE_PROFILES } from '../data/nswZoning';
import type { DevelopmentOption, NewProperty, ScoreResult } from '../types';

/**
 * Scores a property's residential development potential.
 * This is a planning-rules HEURISTIC, not a substitute for a planning certificate,
 * pre-DA advice, or a council LEP check — see notes in each ZoneProfile.
 *
 * Takes the NewProperty shape (no id/createdAt) so it can score a draft in the
 * report view before it's ever saved, as well as a saved Property.
 */
export function scoreProperty(p: NewProperty): ScoreResult {
  const profile = ZONE_PROFILES[p.zone];
  const options: DevelopmentOption[] = [];

  if (!profile.residentialUse) {
    options.push({
      label: 'Residential development',
      eligible: false,
      reason: `${p.zone} (${profile.name}) does not generally permit residential development. ${profile.notes}`,
    });
    return { score: 0, options, summary: 'Not zoned for residential development.' };
  }

  const dualOccMin = p.councilMinLotSqm ?? profile.defaultDualOccMinLotSqm;
  const multiMin = p.councilMinLotSqm ?? profile.defaultMultiDwellingMinLotSqm;
  const subdivMin = p.councilMinLotSqm ?? profile.defaultSubdivisionMinLotSqm;

  // Dual occupancy
  if (dualOccMin) {
    const eligible = p.lotSizeSqm >= dualOccMin;
    options.push({
      label: 'Dual occupancy (2 dwellings)',
      eligible,
      estYield: eligible ? 2 : undefined,
      reason: eligible
        ? `Lot (${p.lotSizeSqm}m²) meets the typical ${dualOccMin}m² dual occupancy minimum for ${p.zone}.`
        : `Lot (${p.lotSizeSqm}m²) is below the typical ${dualOccMin}m² dual occupancy minimum for ${p.zone}.`,
    });
  }

  // Housing SEPP catchment bonus — statewide override allowing dual occ regardless of council minimum in R1-R4 near stations/centres
  if (p.inHousingSeppCatchment && (p.zone === 'R1' || p.zone === 'R2' || p.zone === 'R3' || p.zone === 'R4')) {
    options.push({
      label: 'Low and Mid-Rise Housing SEPP uplift',
      eligible: true,
      estYield: p.zone === 'R2' ? 2 : 3,
      reason: `Site sits within a Housing SEPP walking catchment — dual occupancies (and terraces/townhouses in R2, or wider multi-dwelling uplift in R1/R3/R4) can be permitted as complying/DA development independent of the council's own minimum lot size.`,
    });
  }

  // Multi-dwelling housing / townhouses
  if (multiMin) {
    const eligible = p.lotSizeSqm >= multiMin;
    const estYield = eligible ? Math.max(3, Math.floor(p.lotSizeSqm / (multiMin / 3))) : undefined;
    options.push({
      label: 'Multi-dwelling housing / townhouses',
      eligible,
      estYield,
      reason: eligible
        ? `Lot (${p.lotSizeSqm}m²) meets the typical ${multiMin}m² multi-dwelling minimum for ${p.zone}; rough yield estimate assumes ~${Math.round(multiMin / 3)}m² per dwelling.`
        : `Lot (${p.lotSizeSqm}m²) is below the typical ${multiMin}m² multi-dwelling minimum for ${p.zone}.`,
    });
  }

  // Torrens subdivision
  if (subdivMin) {
    const possibleLots = Math.floor(p.lotSizeSqm / subdivMin);
    const eligible = possibleLots >= 2 && (!p.frontageM || p.frontageM >= 12);
    options.push({
      label: 'Torrens title subdivision',
      eligible,
      estYield: eligible ? possibleLots : undefined,
      reason: eligible
        ? `Lot (${p.lotSizeSqm}m²) could yield ~${possibleLots} lots at the typical ${subdivMin}m² minimum for ${p.zone}${p.frontageM ? ` (frontage ${p.frontageM}m checked against a common 12m minimum)` : ' (frontage not provided — verify against council\'s minimum frontage control)'}.`
        : `Lot (${p.lotSizeSqm}m²) does not comfortably split into 2+ lots at the typical ${subdivMin}m² minimum for ${p.zone}${p.frontageM && p.frontageM < 12 ? `, and frontage (${p.frontageM}m) is likely below the common 12m minimum` : ''}.`,
    });
  }

  const eligibleCount = options.filter((o) => o.eligible).length;
  const bestYield = Math.max(0, ...options.filter((o) => o.eligible).map((o) => o.estYield ?? 0));
  const sizeBonus = Math.min(20, Math.floor(p.lotSizeSqm / 100));
  const score = Math.min(100, eligibleCount * 20 + bestYield * 8 + sizeBonus);

  const summary = eligibleCount === 0
    ? 'No development uplift identified under the current inputs — verify zoning/lot size or check for a council-specific LEP exception.'
    : `${eligibleCount} development pathway${eligibleCount > 1 ? 's' : ''} look feasible; best estimated yield ~${bestYield} dwelling${bestYield === 1 ? '' : 's'}/lots.`;

  return { score, options, summary };
}
