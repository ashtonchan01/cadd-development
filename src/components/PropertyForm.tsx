import { useState } from 'react';
import type { NewProperty, ZoneCode } from '../types';
import { ZONE_OPTIONS, ZONE_PROFILES } from '../data/nswZoning';

const empty: NewProperty = {
  address: '', suburb: '', lga: '', zone: 'R2', lotSizeSqm: 600, frontageM: undefined,
  currentDwellings: 1, councilMinLotSqm: undefined, inHousingSeppCatchment: false,
  price: undefined, notes: '', sourceUrl: '',
};

export function PropertyForm({ onAdd }: { onAdd: (p: NewProperty) => void }) {
  const [form, setForm] = useState<NewProperty>(empty);

  function set<K extends keyof NewProperty>(key: K, value: NewProperty[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.address.trim()) return;
    onAdd(form);
    setForm(empty);
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2>Add property</h2>
      <div className="grid">
        <label>Address<input required value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="12 Example St" /></label>
        <label>Suburb<input value={form.suburb} onChange={(e) => set('suburb', e.target.value)} /></label>
        <label>Council (LGA)<input value={form.lga} onChange={(e) => set('lga', e.target.value)} /></label>
        <label>Zone
          <select value={form.zone} onChange={(e) => set('zone', e.target.value as ZoneCode)}>
            {ZONE_OPTIONS.map((z) => <option key={z} value={z}>{z} — {ZONE_PROFILES[z].name}</option>)}
          </select>
        </label>
        <label>Lot size (m²)<input type="number" min={0} value={form.lotSizeSqm} onChange={(e) => set('lotSizeSqm', Number(e.target.value))} /></label>
        <label>Frontage (m)<input type="number" min={0} value={form.frontageM ?? ''} onChange={(e) => set('frontageM', e.target.value ? Number(e.target.value) : undefined)} /></label>
        <label>Current dwellings<input type="number" min={0} value={form.currentDwellings} onChange={(e) => set('currentDwellings', Number(e.target.value))} /></label>
        <label>Council min lot size (m²) <span className="hint">(optional override)</span>
          <input type="number" min={0} value={form.councilMinLotSqm ?? ''} onChange={(e) => set('councilMinLotSqm', e.target.value ? Number(e.target.value) : undefined)} />
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={!!form.inHousingSeppCatchment} onChange={(e) => set('inHousingSeppCatchment', e.target.checked)} />
          In Housing SEPP walking catchment
        </label>
        <label>Price ($)<input type="number" min={0} value={form.price ?? ''} onChange={(e) => set('price', e.target.value ? Number(e.target.value) : undefined)} /></label>
        <label>Listing URL<input value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://..." /></label>
        <label className="notes">Notes<textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label>
      </div>
      <button type="submit">Add property</button>
    </form>
  );
}
