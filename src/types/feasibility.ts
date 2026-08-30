/** A cost or revenue line spread evenly across `length` months starting at `startMonth` (0-indexed from project start). */
export interface SpreadLine {
  label: string;
  amount: number;
  startMonth: number;
  length: number;
}

export interface RevenueLine {
  label: string;
  units: number;
  pricePerUnit: number;
  startMonth: number;
  length: number;
}

export interface FeasibilityInputs {
  startMonth: string; // 'YYYY-MM', for display only
  sitePurchase: SpreadLine[];
  build: SpreadLine[];
  otherCosts: SpreadLine[];
  revenue: RevenueLine[];
  loanAmount: number;
  interestRatePct: number; // annual, simple interest on the loan balance over the build period
}

export interface MonthRow {
  monthIndex: number;
  label: string;
  costs: number;
  revenue: number;
  net: number;
  cumulative: number;
}

export interface FeasibilityResult {
  totalCosts: number;
  totalRevenue: number;
  profit: number;
  marginPct: number; // profit / totalCosts
  months: MonthRow[];
  projectIrrAnnual: number | null;
  equityIrrAnnual: number | null;
  equityRequired: number;
  interestCost: number;
}
