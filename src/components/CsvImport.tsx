import { useRef, useState } from 'react';
import type { NewProperty } from '../types';
import { CSV_TEMPLATE, parseCsv } from '../utils/csv';

export function CsvImport({ onImport }: { onImport: (rows: NewProperty[]) => void }) {
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const text = await file.text();
    const { rows, errors } = parseCsv(text);
    setErrors(errors);
    if (rows.length) onImport(rows);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cadd-property-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <h2>Bulk import (CSV)</h2>
      <p className="hint">
        No live listing-site scraper is wired up here (site scraping/API access wasn't available in this
        build environment) — export candidate addresses from realestate.com.au / domain.com.au / the NSW
        Planning Portal into this CSV format instead, then import + score them here.
      </p>
      <div className="row">
        <button type="button" onClick={downloadTemplate}>Download CSV template</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (fileRef.current) fileRef.current.value = '';
        }} />
      </div>
      {errors.length > 0 && (
        <ul className="errors">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}
