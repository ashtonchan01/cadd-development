import { useEffect, useMemo, useState } from 'react';
import type { Property } from '../types';
import type { FeasibilityInputs, RevenueLine, SpreadLine } from '../types/feasibility';
import { computeFeasibility } from '../engine/feasibility';
import { defaultFeasibility, loadFeasibility, saveFeasibility } from '../store/feasibilityStore';
import { scoreProperty } from '../engine/scoring';

function SpreadLineRows({
  lines,
  onChange,
}: {
  lines: SpreadLine[];
  onChange: (lines: SpreadLine[]) => void;
}) {
  function update(i: number, patch: Partial<SpreadLine>) {
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function remove(i: number) {
    onChange(lines.filter((_, idx) => idx !== i));
  }
  return (
    <>
      {lines.map((l, i) => (
        <div className="fee-line" key={i}>
          <input value={l.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Label" />
          <input type="number" value={l.amount} onChange={(e) => update(i, { amount: Number(e.target.value) })} placeholder="Amount ($)" />
          <input type="number" min={0} value={l.startMonth} onChange={(e) => update(i, { startMonth: Number(e.target.value) })} placeholder="Start" title="Start month" />
          <input type="number" min={1} value={l.length} onChange={(e) => update(i, { length: Number(e.target.value) })} placeholder="Length" title="Length (months)" />
          <button type="button" className="remove" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button type="button" className="add-line" onClick={() => onChange([...lines, { label: '', amount: 0, startMonth: 0, length: 1 }])}>
        + Add line
      </button>
    </>
  );
}

function RevenueLineRows({
  lines,
  onChange,
}: {
  lines: RevenueLine[];
  onChange: (lines: RevenueLine[]) => void;
}) {
  function update(i: number, patch: Partial<RevenueLine>) {
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function remove(i: number) {
    onChange(lines.filter((_, idx) => idx !== i));
  }
  return (
    <>
      {lines.map((l, i) => (
        <div className="fee-line revenue-line" key={i}>
          <input value={l.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Unit type" />
          <input type="number" min={0} value={l.units} onChange={(e) => update(i, { units: Number(e.target.value) })} placeholder="Units" />
          <input type="number" min={0} value={l.pricePerUnit} onChange={(e) => update(i, { pricePerUnit: Number(e.target.value) })} placeholder="Price/unit ($)" />
          <input type="number" min={0} value={l.startMonth} onChange={(e) => update(i, { startMonth: Number(e.target.value) })} placeholder="Start" title="Start month" />
          <input type="number" min={1} value={l.length} onChange={(e) => update(i, { length: Number(e.target.value) })} placeholder="Length" title="Length (months)" />
          <button type="button" className="remove" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button type="button" className="add-line" onClick={() => onChange([...lines, { label: '', units: 1, pricePerUnit: 0, startMonth: 0, length: 1 }])}>
        + Add unit type
      </button>
    </>
  );
}

export function FeasibilityCalculator({ property, onBack }: { property: Property; onBack: () => void }) {
  const [inputs, setInputs] = useState<FeasibilityInputs>(() => {
    const saved = loadFeasibility(property.id);
    if (saved) return saved;
    const estYield = Math.max(...scoreProperty(property).options.map((o) => o.estYield ?? 0), 1);
    return defaultFeasibility(estYield, property.price);
  });
  const [savedFlag, setSavedFlag] = useState(false);

  useEffect(() => { saveFeasibility(property.id, inputs); setSavedFlag(true); }, [inputs, property.id]);

  const result = useMemo(() => computeFeasibility(inputs), [inputs]);

  function set<K extends keyof FeasibilityInputs>(key: K, value: FeasibilityInputs[K]) {
    setInputs((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="feasibility">
      <button type="button" className="back-link" onClick={onBack}>← Back to saved properties</button>

      <div className="card">
        <h2>{property.address}</h2>
        <p className="hint">
          Development feasibility — simplified model (straight-line cost/revenue spread, simple loan
          interest). Not a bank-ready appraisal; verify before relying on it.
          {savedFlag && <span className="hint-ok"> Autosaved.</span>}
        </p>
      </div>

      <div className="card summary-grid">
        <SummaryStat label="Total costs" value={money(result.totalCosts)} />
        <SummaryStat label="Total revenue" value={money(result.totalRevenue)} />
        <SummaryStat label="Profit" value={money(result.profit)} tone={result.profit >= 0 ? 'positive' : 'danger'} />
        <SummaryStat label="Development margin" value={`${result.marginPct.toFixed(1)}%`} tone={result.marginPct >= 0 ? 'positive' : 'danger'} />
        <SummaryStat label="Project IRR" value={result.projectIrrAnnual !== null ? `${result.projectIrrAnnual.toFixed(1)}%` : '—'} />
        <SummaryStat label="Equity IRR" value={result.equityIrrAnnual !== null ? `${result.equityIrrAnnual.toFixed(1)}%` : '—'} />
        <SummaryStat label="Equity required" value={money(result.equityRequired)} />
        <SummaryStat label="Loan interest cost" value={money(result.interestCost)} />
      </div>

      <div className="card">
        <h2>Site purchase</h2>
        <div className="fee-line fee-header"><span>Label</span><span>Amount</span><span>Start</span><span>Length</span><span></span></div>
        <SpreadLineRows lines={inputs.sitePurchase} onChange={(v) => set('sitePurchase', v)} />
      </div>

      <div className="card">
        <h2>Build</h2>
        <div className="fee-line fee-header"><span>Label</span><span>Amount</span><span>Start</span><span>Length</span><span></span></div>
        <SpreadLineRows lines={inputs.build} onChange={(v) => set('build', v)} />
      </div>

      <div className="card">
        <h2>Other costs</h2>
        <div className="fee-line fee-header"><span>Label</span><span>Amount</span><span>Start</span><span>Length</span><span></span></div>
        <SpreadLineRows lines={inputs.otherCosts} onChange={(v) => set('otherCosts', v)} />
      </div>

      <div className="card">
        <h2>Revenue</h2>
        <div className="fee-line revenue-line fee-header"><span>Unit type</span><span>Units</span><span>Price/unit</span><span>Start</span><span>Length</span><span></span></div>
        <RevenueLineRows lines={inputs.revenue} onChange={(v) => set('revenue', v)} />
      </div>

      <div className="card">
        <h2>Finance</h2>
        <div className="grid">
          <label>Loan amount ($)<input type="number" min={0} value={inputs.loanAmount} onChange={(e) => set('loanAmount', Number(e.target.value))} /></label>
          <label>Interest rate (% p.a.)<input type="number" min={0} step={0.1} value={inputs.interestRatePct} onChange={(e) => set('interestRatePct', Number(e.target.value))} /></label>
        </div>
      </div>

      <div className="card cashflow-card">
        <h2>Monthly cashflow</h2>
        <div className="cashflow-scroll">
          <table className="cashflow-table">
            <thead>
              <tr>
                <th>Month</th>
                {result.months.map((m) => <th key={m.monthIndex}>{m.label}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr><td>Costs</td>{result.months.map((m) => <td key={m.monthIndex}>{m.costs ? money(-m.costs) : '—'}</td>)}</tr>
              <tr><td>Revenue</td>{result.months.map((m) => <td key={m.monthIndex}>{m.revenue ? money(m.revenue) : '—'}</td>)}</tr>
              <tr className="net-row"><td>Net</td>{result.months.map((m) => <td key={m.monthIndex}>{money(m.net)}</td>)}</tr>
              <tr className="cumulative-row"><td>Cumulative</td>{result.months.map((m) => <td key={m.monthIndex}>{money(m.cumulative)}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'danger' }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function money(n: number): string {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
}
