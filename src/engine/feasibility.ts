import type { FeasibilityInputs, FeasibilityResult, MonthRow, RevenueLine, SpreadLine } from '../types/feasibility';

/**
 * Development feasibility calculator: costs/revenue entered as amount + start
 * month + length are spread evenly across those months (matching the common
 * "start / length / rate" pattern used by development appraisal tools), then
 * IRR is solved on the resulting monthly net cashflow.
 *
 * This is a simplified model, not a full development appraisal:
 * - Interest is simple interest on the full loan amount over the build period,
 *   not a drawdown schedule against actual monthly balances.
 * - Equity cashflow assumes equity funds a fixed proportion of every cost line
 *   and receives net proceeds after loan repayment at the final month with
 *   revenue — real facilities draw down and repay on their own schedule.
 * Treat the outputs as a working estimate, not a bank-ready feasibility study.
 */

function monthCount(inputs: FeasibilityInputs): number {
  const ends = [
    ...inputs.sitePurchase.map((l) => l.startMonth + l.length),
    ...inputs.build.map((l) => l.startMonth + l.length),
    ...inputs.otherCosts.map((l) => l.startMonth + l.length),
    ...inputs.revenue.map((l) => l.startMonth + l.length),
  ];
  return Math.max(1, ...ends);
}

function spreadInto(target: number[], line: SpreadLine): void {
  if (line.length <= 0 || line.amount === 0) return;
  const perMonth = line.amount / line.length;
  for (let i = 0; i < line.length; i++) {
    const m = line.startMonth + i;
    if (m >= 0 && m < target.length) target[m] += perMonth;
  }
}

function spreadRevenueInto(target: number[], line: RevenueLine): void {
  const total = line.units * line.pricePerUnit;
  spreadInto(target, { label: line.label, amount: total, startMonth: line.startMonth, length: line.length });
}

// Bisection for the monthly rate r solving sum(cashflow[t] / (1+r)^t) = 0.
function solveMonthlyIrr(cashflow: number[]): number | null {
  const npv = (r: number) => cashflow.reduce((sum, cf, t) => sum + cf / Math.pow(1 + r, t), 0);

  // Real development cashflows aren't guaranteed to cross zero exactly once
  // (e.g. a loan repayment lump can push the final month negative again), so
  // scan for a sign change first rather than assuming the two endpoints
  // bracket the only root.
  // Bounds kept well short of -1: as r → -1, (1+r)^t → 0 for large t and the
  // discount factor blows up, which can produce a spurious near-zero crossing
  // that isn't a genuine root — not a real monthly rate any project would have.
  const steps = 400;
  let lo = -0.5; // -50%/month is already an extreme monthly rate
  let hi = 3; // 300%/month ceiling — plenty for a monthly rate
  let prevRate = lo;
  let prevVal = npv(lo);
  if (Number.isNaN(prevVal)) return null;

  let bracketLo: number | null = null;
  let bracketHi: number | null = null;
  for (let i = 1; i <= steps; i++) {
    const rate = lo + ((hi - lo) * i) / steps;
    const val = npv(rate);
    if (Number.isNaN(val)) continue;
    if (Math.abs(val) < 1e-6) return rate;
    if (prevVal * val < 0) {
      bracketLo = prevRate;
      bracketHi = rate;
      break;
    }
    prevRate = rate;
    prevVal = val;
  }
  if (bracketLo === null || bracketHi === null) return null;

  let a = bracketLo;
  let b = bracketHi;
  const npvA = npv(a);
  for (let i = 0; i < 100; i++) {
    const mid = (a + b) / 2;
    const v = npv(mid);
    if (Math.abs(v) < 1e-6) return mid;
    if ((npvA < 0 && v < 0) || (npvA > 0 && v > 0)) a = mid; else b = mid;
  }
  return (a + b) / 2;
}

function annualize(monthlyRate: number | null): number | null {
  if (monthlyRate === null) return null;
  return (Math.pow(1 + monthlyRate, 12) - 1) * 100;
}

export function computeFeasibility(inputs: FeasibilityInputs): FeasibilityResult {
  const n = monthCount(inputs);
  const costs = new Array(n).fill(0);
  const revenue = new Array(n).fill(0);

  [...inputs.sitePurchase, ...inputs.build, ...inputs.otherCosts].forEach((l) => spreadInto(costs, l));
  inputs.revenue.forEach((l) => spreadRevenueInto(revenue, l));

  const totalCosts = costs.reduce((a, b) => a + b, 0);
  const totalRevenue = revenue.reduce((a, b) => a + b, 0);
  const profit = totalRevenue - totalCosts;
  const marginPct = totalCosts > 0 ? (profit / totalCosts) * 100 : 0;

  const buildMonths = inputs.build.reduce((max, l) => Math.max(max, l.length), 0);
  const interestCost = (inputs.loanAmount * (inputs.interestRatePct / 100) * buildMonths) / 12;

  const months: MonthRow[] = [];
  let cumulative = 0;
  for (let m = 0; m < n; m++) {
    const net = revenue[m] - costs[m];
    cumulative += net;
    months.push({ monthIndex: m, label: `Month ${m + 1}`, costs: costs[m], revenue: revenue[m], net, cumulative });
  }

  const projectCashflow = months.map((r) => r.net);
  const projectIrrAnnual = annualize(solveMonthlyIrr(projectCashflow));

  const equityRequired = Math.max(0, totalCosts - inputs.loanAmount);
  const equityShare = totalCosts > 0 ? equityRequired / totalCosts : 1;
  const lastRevenueMonth = months.reduce((last, r, i) => (r.revenue > 0 ? i : last), -1);

  const equityCashflow = months.map((r, i) => {
    let net = r.revenue - r.costs * equityShare;
    if (i === lastRevenueMonth) net -= inputs.loanAmount + interestCost;
    return net;
  });
  const equityIrrAnnual = annualize(solveMonthlyIrr(equityCashflow));

  return { totalCosts, totalRevenue, profit, marginPct, months, projectIrrAnnual, equityIrrAnnual, equityRequired, interestCost };
}
