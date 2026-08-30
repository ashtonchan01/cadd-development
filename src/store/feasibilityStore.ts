import type { FeasibilityInputs } from '../types/feasibility';

const KEY_PREFIX = 'cadd:feasibility:';

export function loadFeasibility(propertyId: string): FeasibilityInputs | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + propertyId);
    return raw ? (JSON.parse(raw) as FeasibilityInputs) : null;
  } catch {
    return null;
  }
}

export function saveFeasibility(propertyId: string, inputs: FeasibilityInputs): void {
  localStorage.setItem(KEY_PREFIX + propertyId, JSON.stringify(inputs));
}

export function defaultFeasibility(estYield: number, price: number | undefined): FeasibilityInputs {
  const units = Math.max(1, estYield || 1);
  const sitePrice = price ?? 800000;

  return {
    startMonth: new Date().toISOString().slice(0, 7),
    sitePurchase: [
      { label: 'Purchase price', amount: sitePrice, startMonth: 0, length: 1 },
      { label: 'Stamp duty', amount: Math.round(sitePrice * 0.04), startMonth: 0, length: 1 },
      { label: 'Legal & adjustments', amount: 5000, startMonth: 0, length: 1 },
    ],
    build: [
      { label: 'Preliminary costs', amount: 30000, startMonth: 2, length: 1 },
      { label: 'Construction', amount: units * 350000, startMonth: 3, length: 9 },
    ],
    otherCosts: [
      { label: 'Land surveyor', amount: 3000, startMonth: 0, length: 1 },
      { label: 'Drafting / planning (DA)', amount: 15000, startMonth: 0, length: 3 },
      { label: 'Project management', amount: 20000, startMonth: 2, length: 9 },
      { label: 'Council / authority fees', amount: 10000, startMonth: 2, length: 1 },
    ],
    revenue: [
      { label: 'Unit sales', units, pricePerUnit: units > 1 ? 750000 : sitePrice * 1.4, startMonth: 12, length: 2 },
    ],
    loanAmount: Math.round((sitePrice + units * 350000) * 0.65),
    interestRatePct: 8,
  };
}
