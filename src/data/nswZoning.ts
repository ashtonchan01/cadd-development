import type { ZoneCode } from '../types';

/**
 * General statewide defaults derived from the NSW Standard Instrument LEP zone
 * objectives and the Low and Mid-Rise Housing SEPP (2023) / Housing Code (complying
 * development). These are STARTING POINTS ONLY — every council's own LEP sets its
 * own minimum lot size map (clause 4.1/4.1A) which can override these figures for a
 * specific parcel. Always verify against the relevant council's LEP maps / planning
 * certificate (s10.7) before relying on a result.
 */
export interface ZoneProfile {
  code: ZoneCode;
  name: string;
  residentialUse: boolean;
  /** Typical default minimum lot size (sqm) for dual occupancy, if not overridden by council LEP */
  defaultDualOccMinLotSqm?: number;
  /** Typical default minimum lot size (sqm) for multi-dwelling housing / townhouses */
  defaultMultiDwellingMinLotSqm?: number;
  /** Typical minimum lot size (sqm) per resulting lot for a standard Torrens subdivision */
  defaultSubdivisionMinLotSqm?: number;
  notes: string;
}

export const ZONE_PROFILES: Record<ZoneCode, ZoneProfile> = {
  R1: {
    code: 'R1', name: 'General Residential', residentialUse: true,
    defaultDualOccMinLotSqm: 450, defaultMultiDwellingMinLotSqm: 600, defaultSubdivisionMinLotSqm: 450,
    notes: 'Broadest residential zone — dwellings, dual occ, multi-dwelling and residential flats often permissible subject to LEP/DCP controls.',
  },
  R2: {
    code: 'R2', name: 'Low Density Residential', residentialUse: true,
    defaultDualOccMinLotSqm: 450, defaultSubdivisionMinLotSqm: 450,
    notes: 'Primarily single dwellings + dual occupancy. Multi-dwelling housing usually NOT permitted outright, unless inside a Low and Mid-Rise Housing SEPP catchment.',
  },
  R3: {
    code: 'R3', name: 'Medium Density Residential', residentialUse: true,
    defaultDualOccMinLotSqm: 400, defaultMultiDwellingMinLotSqm: 600, defaultSubdivisionMinLotSqm: 400,
    notes: 'Townhouses / multi-dwelling housing / manor houses generally permissible — best zone for multi-lot development.',
  },
  R4: {
    code: 'R4', name: 'High Density Residential', residentialUse: true,
    defaultMultiDwellingMinLotSqm: 800,
    notes: 'Residential flat buildings — usually needs larger consolidated sites; check FSR/height controls.',
  },
  R5: {
    code: 'R5', name: 'Large Lot Residential', residentialUse: true,
    defaultSubdivisionMinLotSqm: 4000,
    notes: 'Rural-residential character — subdivision minimums are large; multi-dwelling development is rare.',
  },
  RU1: { code: 'RU1', name: 'Primary Production', residentialUse: false, notes: 'Rural — dwelling entitlement and subdivision heavily constrained.' },
  RU5: { code: 'RU5', name: 'Village', residentialUse: true, defaultDualOccMinLotSqm: 550, defaultSubdivisionMinLotSqm: 550, notes: 'Village-scale — check specific village LEP provisions.' },
  B1: { code: 'B1', name: 'Neighbourhood Centre', residentialUse: true, defaultMultiDwellingMinLotSqm: 600, notes: 'Shop-top housing / mixed use often permitted.' },
  B2: { code: 'B2', name: 'Local Centre', residentialUse: true, defaultMultiDwellingMinLotSqm: 600, notes: 'Mixed use / shop-top housing common; good multi-unit potential.' },
  B4: { code: 'B4', name: 'Mixed Use', residentialUse: true, defaultMultiDwellingMinLotSqm: 600, notes: 'Residential + commercial mix, often no numeric minimum — check FSR/height instead.' },
  E1: { code: 'E1', name: 'Local Centre (Employment)', residentialUse: false, notes: 'Employment-zoned — residential generally not permitted (post-2023 employment zone reform).' },
  E2: { code: 'E2', name: 'Commercial Centre', residentialUse: false, notes: 'Employment-zoned — residential generally not permitted.' },
  E3: { code: 'E3', name: 'Productivity Support', residentialUse: false, notes: 'Employment-zoned — residential generally not permitted.' },
  E4: { code: 'E4', name: 'General Industrial', residentialUse: false, notes: 'Industrial — residential not permitted.' },
  OTHER: { code: 'OTHER', name: 'Other / Unknown', residentialUse: false, notes: 'Zone not recognised — verify manually via the NSW Planning Portal.' },
};

export const ZONE_OPTIONS: ZoneCode[] = Object.keys(ZONE_PROFILES) as ZoneCode[];
