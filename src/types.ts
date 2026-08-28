export type ZoneCode =
  | 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
  | 'RU1' | 'RU5'
  | 'B1' | 'B2' | 'B4'
  | 'E1' | 'E2' | 'E3' | 'E4'
  | 'OTHER';

export interface Property {
  id: string;
  address: string;
  suburb: string;
  lga: string; // council / Local Government Area
  zone: ZoneCode;
  lotSizeSqm: number;
  frontageM?: number;
  currentDwellings: number;
  /** Council LEP minimum subdivision lot size for this zone, in sqm, if known — overrides the statewide default */
  councilMinLotSqm?: number;
  /** Within a "walking catchment" of a train station / town centre per the Low and Mid-Rise Housing SEPP maps */
  inHousingSeppCatchment?: boolean;
  price?: number;
  notes?: string;
  sourceUrl?: string;
  createdAt: number;
}

export type NewProperty = Omit<Property, 'id' | 'createdAt'>;

export interface DevelopmentOption {
  label: string;
  eligible: boolean;
  reason: string;
  estYield?: number; // estimated number of resulting dwellings/lots
}

export interface ScoreResult {
  score: number; // 0-100
  options: DevelopmentOption[];
  summary: string;
}
