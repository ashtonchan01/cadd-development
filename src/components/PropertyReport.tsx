import { useEffect, useMemo, useState } from 'react';
import type { NewProperty, ZoneCode } from '../types';
import type { AddressCandidate } from '../services/addressSearch';
import { lookupPlanningControls } from '../services/planningLookup';
import { scoreProperty } from '../engine/scoring';
import { ZONE_OPTIONS, ZONE_PROFILES } from '../data/nswZoning';

function draftFor(candidate: AddressCandidate): NewProperty {
  return {
    address: candidate.fullAddress,
    suburb: candidate.suburb,
    lga: '',
    zone: 'R2',
    lotSizeSqm: 600,
    frontageM: undefined,
    currentDwellings: 1,
    councilMinLotSqm: undefined,
    inHousingSeppCatchment: false,
    price: undefined,
    notes: '',
    sourceUrl: '',
  };
}

export function PropertyReport({
  candidate,
  onSave,
  onBack,
}: {
  candidate: AddressCandidate;
  onSave: (p: NewProperty) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<NewProperty>(() => draftFor(candidate));
  const [planningStatus, setPlanningStatus] = useState<'loading' | 'found' | 'none'>('loading');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(draftFor(candidate));
    setSaved(false);

    if (candidate.lat === undefined || candidate.lon === undefined) {
      setPlanningStatus('none');
      return;
    }

    let cancelled = false;
    setPlanningStatus('loading');
    lookupPlanningControls(candidate.lat, candidate.lon).then((controls) => {
      if (cancelled) return;
      if (!controls.zone && !controls.lga && !controls.councilMinLotSqm) {
        setPlanningStatus('none');
        return;
      }
      setDraft((d) => ({
        ...d,
        zone: controls.zone ?? d.zone,
        lga: controls.lga ?? d.lga,
        councilMinLotSqm: controls.councilMinLotSqm ?? d.councilMinLotSqm,
      }));
      setPlanningStatus('found');
    });
    return () => { cancelled = true; };
  }, [candidate]);

  function set<K extends keyof NewProperty>(key: K, value: NewProperty[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const result = useMemo(() => scoreProperty(draft), [draft]);

  return (
    <div className="report">
      <button type="button" className="back-link" onClick={onBack}>← New search</button>

      <div className="card report-header">
        <h2>{draft.address}</h2>
        {planningStatus === 'loading' && <p className="hint">Looking up zoning from the NSW Planning Portal…</p>}
        {planningStatus === 'found' && <p className="hint hint-ok">Zone, council &amp; min lot size auto-filled — verify before relying on it.</p>}
        {planningStatus === 'none' && <p className="hint">No planning data found for this point — enter zoning manually below.</p>}
        <div className={`report-score score-${scoreBand(result.score)}`}>
          <span className="score-badge big">{result.score}</span>
          <span>{result.summary}</span>
        </div>
      </div>

      <div className="card">
        <h2>Development options</h2>
        <ul className="options">
          {result.options.map((o, i) => (
            <li key={i} className={o.eligible ? 'eligible' : 'ineligible'}>
              <strong>{o.eligible ? '✓' : '✗'} {o.label}</strong>
              {o.estYield ? ` — est. ${o.estYield} dwelling(s)/lots` : ''}
              <div className="reason">{o.reason}</div>
            </li>
          ))}
        </ul>
      </div>

      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
          setSaved(true);
        }}
      >
        <h2>Property details</h2>
        <div className="grid">
          <label>Suburb<input value={draft.suburb} onChange={(e) => set('suburb', e.target.value)} /></label>
          <label>Council (LGA)<input value={draft.lga} onChange={(e) => set('lga', e.target.value)} /></label>
          <label>Zone
            <select value={draft.zone} onChange={(e) => set('zone', e.target.value as ZoneCode)}>
              {ZONE_OPTIONS.map((z) => <option key={z} value={z}>{z} — {ZONE_PROFILES[z].name}</option>)}
            </select>
          </label>
          <label>Lot size (m²)<input type="number" min={0} value={draft.lotSizeSqm} onChange={(e) => set('lotSizeSqm', Number(e.target.value))} /></label>
          <label>Frontage (m)<input type="number" min={0} value={draft.frontageM ?? ''} onChange={(e) => set('frontageM', e.target.value ? Number(e.target.value) : undefined)} /></label>
          <label>Current dwellings<input type="number" min={0} value={draft.currentDwellings} onChange={(e) => set('currentDwellings', Number(e.target.value))} /></label>
          <label>Council min lot size (m²) <span className="hint">(optional override)</span>
            <input type="number" min={0} value={draft.councilMinLotSqm ?? ''} onChange={(e) => set('councilMinLotSqm', e.target.value ? Number(e.target.value) : undefined)} />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={!!draft.inHousingSeppCatchment} onChange={(e) => set('inHousingSeppCatchment', e.target.checked)} />
            In Housing SEPP walking catchment
          </label>
          <label>Price ($)<input type="number" min={0} value={draft.price ?? ''} onChange={(e) => set('price', e.target.value ? Number(e.target.value) : undefined)} /></label>
          <label>Listing URL<input value={draft.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://..." /></label>
          <label className="notes">Notes<textarea value={draft.notes} onChange={(e) => set('notes', e.target.value)} /></label>
        </div>
        <button type="submit">{saved ? 'Saved ✓ — save again' : 'Save to my properties'}</button>
      </form>

      <div className="card">
        <h2>Comparable sales</h2>
        <p className="hint">
          <a
            href="https://www.nsw.gov.au/housing-and-construction/buying-and-selling-property/find-property-sales-information"
            target="_blank"
            rel="noreferrer"
          >
            NSW Valuer General sale price search
          </a>
          {draft.suburb && ` — search for "${draft.suburb}"`} (free, but a registered bulk-file/manual
          search, not a live per-address API — see the README for why).
        </p>
      </div>
    </div>
  );
}

function scoreBand(score: number): 'high' | 'mid' | 'low' {
  if (score >= 60) return 'high';
  if (score >= 30) return 'mid';
  return 'low';
}
