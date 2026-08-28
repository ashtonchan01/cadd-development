import { Fragment, useMemo, useState } from 'react';
import type { Property } from '../types';
import { scoreProperty } from '../engine/scoring';

export function PropertyTable({ properties, onRemove }: { properties: Property[]; onRemove: (id: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const scored = useMemo(
    () => properties
      .map((p) => ({ p, result: scoreProperty(p) }))
      .sort((a, b) => b.result.score - a.result.score),
    [properties],
  );

  if (properties.length === 0) {
    return <div className="card"><p className="hint">No properties yet — add one above or import a CSV.</p></div>;
  }

  return (
    <div className="card">
      <h2>Properties ({properties.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Score</th><th>Address</th><th>Suburb</th><th>Zone</th><th>Lot (m²)</th><th>Summary</th><th></th>
          </tr>
        </thead>
        <tbody>
          {scored.map(({ p, result }) => (
            <Fragment key={p.id}>
              <tr className={`row score-${scoreBand(result.score)}`} onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                <td><span className="score-badge">{result.score}</span></td>
                <td>{p.address}{p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}> ↗</a>}</td>
                <td>{p.suburb}</td>
                <td>{p.zone}</td>
                <td>{p.lotSizeSqm}</td>
                <td className="summary-cell">{result.summary}</td>
                <td><button type="button" className="remove" onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}>✕</button></td>
              </tr>
              {expanded === p.id && (
                <tr className="detail-row">
                  <td colSpan={7}>
                    <ul className="options">
                      {result.options.map((o, i) => (
                        <li key={i} className={o.eligible ? 'eligible' : 'ineligible'}>
                          <strong>{o.eligible ? '✓' : '✗'} {o.label}</strong>
                          {o.estYield ? ` — est. ${o.estYield} dwelling(s)/lots` : ''}
                          <div className="reason">{o.reason}</div>
                        </li>
                      ))}
                    </ul>
                    {p.notes && <p className="notes-view"><em>Notes:</em> {p.notes}</p>}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function scoreBand(score: number): 'high' | 'mid' | 'low' {
  if (score >= 60) return 'high';
  if (score >= 30) return 'mid';
  return 'low';
}
