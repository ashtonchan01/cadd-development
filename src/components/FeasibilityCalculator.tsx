import { useEffect, useMemo, useState } from 'react';
import type { Property } from '../types';
import type { FeasibilityInputs, RevenueLine, SpreadLine } from '../types/feasibility';
import { computeFeasibility, lineMonthlyAmounts, monthCount, monthLabels, revenueLineMonthlyAmounts } from '../engine/feasibility';
import { defaultFeasibility, loadFeasibility, saveFeasibility } from '../store/feasibilityStore';
import { scoreProperty } from '../engine/scoring';

type Section = 'sitePurchase' | 'build' | 'otherCosts';

function money(n: number): string {
  if (!n) return '—';
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
}

export function FeasibilityCalculator({ property, onBack }: { property: Property; onBack: () => void }) {
  const [inputs, setInputs] = useState<FeasibilityInputs>(() => {
    const saved = loadFeasibility(property.id);
    if (saved) return saved;
    const estYield = Math.max(...scoreProperty(property).options.map((o) => o.estYield ?? 0), 1);
    return defaultFeasibility(estYield, property.price);
  });

  useEffect(() => { saveFeasibility(property.id, inputs); }, [inputs, property.id]);

  const result = useMemo(() => computeFeasibility(inputs), [inputs]);
  const months = monthCount(inputs);
  const labels = useMemo(() => monthLabels(inputs.startMonth, months), [inputs.startMonth, months]);

  function set<K extends keyof FeasibilityInputs>(key: K, value: FeasibilityInputs[K]) {
    setInputs((d) => ({ ...d, [key]: value }));
  }

  function updateSection(section: Section, i: number, patch: Partial<SpreadLine>) {
    setInputs((d) => ({ ...d, [section]: d[section].map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  }
  function removeFromSection(section: Section, i: number) {
    setInputs((d) => ({ ...d, [section]: d[section].filter((_, idx) => idx !== i) }));
  }
  function addToSection(section: Section) {
    setInputs((d) => ({ ...d, [section]: [...d[section], { label: '', amount: 0, startMonth: 0, length: 1 }] }));
  }

  function updateRevenue(i: number, patch: Partial<RevenueLine>) {
    setInputs((d) => ({ ...d, revenue: d.revenue.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  }
  function removeRevenue(i: number) {
    setInputs((d) => ({ ...d, revenue: d.revenue.filter((_, idx) => idx !== i) }));
  }
  function addRevenue() {
    setInputs((d) => ({ ...d, revenue: [...d.revenue, { label: '', units: 1, pricePerUnit: 0, startMonth: 0, length: 1 }] }));
  }

  const sectionTotal = (section: Section) => inputs[section].reduce((s, l) => s + l.amount, 0);
  const revenueTotal = inputs.revenue.reduce((s, l) => s + l.units * l.pricePerUnit, 0);

  return (
    <div className="feasibility">
      <button type="button" className="back-link" onClick={onBack}>← Back to saved properties</button>

      <div className="card feas-toolbar">
        <div>
          <h2>{property.address}</h2>
          <p className="hint">Simplified feasibility model — not a bank-ready appraisal. Autosaves per property.</p>
        </div>
        <div className="feas-irr">
          <div><span className="hint">Project IRR</span><strong className={result.projectIrrAnnual !== null && result.projectIrrAnnual < 0 ? 'neg' : ''}>{result.projectIrrAnnual !== null ? `${result.projectIrrAnnual.toFixed(1)}%` : '—'}</strong></div>
          <div><span className="hint">Equity IRR</span><strong className={result.equityIrrAnnual !== null && result.equityIrrAnnual < 0 ? 'neg' : ''}>{result.equityIrrAnnual !== null ? `${result.equityIrrAnnual.toFixed(1)}%` : '—'}</strong></div>
          <div><span className="hint">Margin</span><strong className={result.marginPct < 0 ? 'neg' : ''}>{result.marginPct.toFixed(1)}%</strong></div>
          <div><span className="hint">Profit</span><strong className={result.profit < 0 ? 'neg' : ''}>{money(result.profit)}</strong></div>
        </div>
      </div>

      <div className="card feas-sheet-card">
        <div className="feas-sheet-scroll">
          <table className="feas-sheet">
            <thead>
              <tr>
                <th className="col-label">
                  Start month
                  <input className="start-month-input" value={inputs.startMonth} onChange={(e) => set('startMonth', e.target.value)} placeholder="YYYY-MM" />
                </th>
                <th className="col-total">total</th>
                <th className="col-start">start</th>
                <th className="col-length">length</th>
                {labels.map((l, i) => <th key={i} className="col-month">{l}</th>)}
                <th className="col-del"></th>
              </tr>
            </thead>
            <tbody>
              <SectionHeader label="Revenue" total={revenueTotal} months={months} />
              {inputs.revenue.map((line, i) => {
                const amounts = revenueLineMonthlyAmounts(line, months);
                return (
                  <tr key={i}>
                    <td className="col-label"><input value={line.label} onChange={(e) => updateRevenue(i, { label: e.target.value })} placeholder="Unit type" /></td>
                    <td className="col-total">{money(line.units * line.pricePerUnit)}</td>
                    <td className="col-start"><input type="number" min={0} value={line.startMonth} onChange={(e) => updateRevenue(i, { startMonth: Number(e.target.value) })} /></td>
                    <td className="col-length"><input type="number" min={1} value={line.length} onChange={(e) => updateRevenue(i, { length: Number(e.target.value) })} /></td>
                    {amounts.map((a, m) => <td key={m} className="col-month num">{a ? money(a) : ''}</td>)}
                    <td className="col-del"><button type="button" className="remove" onClick={() => removeRevenue(i)}>✕</button></td>
                  </tr>
                );
              })}
              <tr className="add-row">
                <td colSpan={4}>
                  <div className="row-inline-inputs">
                    <button type="button" className="add-line" onClick={addRevenue}>+ Add unit type</button>
                    <label className="units-hint">units × price/unit editable inline once added</label>
                  </div>
                </td>
                <td colSpan={months + 1}></td>
              </tr>

              <SectionRows
                title="Site Purchase" section="sitePurchase" lines={inputs.sitePurchase} months={months}
                total={sectionTotal('sitePurchase')}
                onUpdate={(i, patch) => updateSection('sitePurchase', i, patch)}
                onRemove={(i) => removeFromSection('sitePurchase', i)}
                onAdd={() => addToSection('sitePurchase')}
              />
              <SectionRows
                title="Build" section="build" lines={inputs.build} months={months}
                total={sectionTotal('build')}
                onUpdate={(i, patch) => updateSection('build', i, patch)}
                onRemove={(i) => removeFromSection('build', i)}
                onAdd={() => addToSection('build')}
              />
              <SectionRows
                title="Other Costs" section="otherCosts" lines={inputs.otherCosts} months={months}
                total={sectionTotal('otherCosts')}
                onUpdate={(i, patch) => updateSection('otherCosts', i, patch)}
                onRemove={(i) => removeFromSection('otherCosts', i)}
                onAdd={() => addToSection('otherCosts')}
              />

              <tr className="section-header">
                <td className="col-label">Finance</td>
                <td className="col-total"></td>
                <td colSpan={2 + months + 1}></td>
              </tr>
              <tr>
                <td className="col-label">Loan amount</td>
                <td className="col-total"><input type="number" min={0} value={inputs.loanAmount} onChange={(e) => set('loanAmount', Number(e.target.value))} /></td>
                <td className="col-label" colSpan={2}>Interest rate (% p.a.)</td>
                <td className="col-num"><input type="number" min={0} step={0.1} value={inputs.interestRatePct} onChange={(e) => set('interestRatePct', Number(e.target.value))} /></td>
                <td colSpan={months - 1 + 1}></td>
              </tr>

              <tr className="net-row">
                <td className="col-label">Net cashflow</td>
                <td colSpan={3}></td>
                {result.months.map((m) => <td key={m.monthIndex} className="col-month num">{money(m.net)}</td>)}
                <td></td>
              </tr>
              <tr className="cumulative-row">
                <td className="col-label">Cumulative</td>
                <td colSpan={3}></td>
                {result.months.map((m) => <td key={m.monthIndex} className="col-month num">{money(m.cumulative)}</td>)}
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, total, months }: { label: string; total: number; months: number }) {
  return (
    <tr className="section-header">
      <td className="col-label">{label}</td>
      <td className="col-total">{money(total)}</td>
      <td colSpan={2 + months + 1}></td>
    </tr>
  );
}

function SectionRows({
  title, lines, months, total, onUpdate, onRemove, onAdd,
}: {
  title: string;
  section: Section;
  lines: SpreadLine[];
  months: number;
  total: number;
  onUpdate: (i: number, patch: Partial<SpreadLine>) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
}) {
  return (
    <>
      <SectionHeader label={title} total={total} months={months} />
      {lines.map((line, i) => {
        const amounts = lineMonthlyAmounts(line, months);
        return (
          <tr key={i}>
            <td className="col-label"><input value={line.label} onChange={(e) => onUpdate(i, { label: e.target.value })} placeholder="Label" /></td>
            <td className="col-total"><input type="number" value={line.amount} onChange={(e) => onUpdate(i, { amount: Number(e.target.value) })} /></td>
            <td className="col-start"><input type="number" min={0} value={line.startMonth} onChange={(e) => onUpdate(i, { startMonth: Number(e.target.value) })} /></td>
            <td className="col-length"><input type="number" min={1} value={line.length} onChange={(e) => onUpdate(i, { length: Number(e.target.value) })} /></td>
            {amounts.map((a, m) => <td key={m} className="col-month num">{a ? money(a) : ''}</td>)}
            <td className="col-del"><button type="button" className="remove" onClick={() => onRemove(i)}>✕</button></td>
          </tr>
        );
      })}
      <tr className="add-row">
        <td colSpan={4}><button type="button" className="add-line" onClick={onAdd}>+ Add line</button></td>
        <td colSpan={months + 1}></td>
      </tr>
    </>
  );
}
