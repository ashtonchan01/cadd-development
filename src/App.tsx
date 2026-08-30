import { useEffect, useState } from 'react';
import type { NewProperty, Property } from './types';
import { addProperty, loadProperties, removeProperty, saveProperties } from './store/propertyStore';
import { SearchHome } from './components/SearchHome';
import { PropertyReport } from './components/PropertyReport';
import { PropertyTable } from './components/PropertyTable';
import { FeasibilityCalculator } from './components/FeasibilityCalculator';
import type { AddressCandidate } from './services/addressSearch';
import './App.css';

type View = 'search' | 'report' | 'saved' | 'feasibility';

function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [view, setView] = useState<View>('search');
  const [candidate, setCandidate] = useState<AddressCandidate | null>(null);
  const [feasibilityPropertyId, setFeasibilityPropertyId] = useState<string | null>(null);

  useEffect(() => { setProperties(loadProperties()); }, []);

  function handleFound(c: AddressCandidate) {
    setCandidate(c);
    setView('report');
  }

  function handleSave(p: NewProperty) {
    setProperties((cur) => addProperty(cur, p));
  }

  function handleRemove(id: string) {
    setProperties((cur) => removeProperty(cur, id));
  }

  function handleFeasibility(id: string) {
    setFeasibilityPropertyId(id);
    setView('feasibility');
  }

  function clearAll() {
    if (!confirm('Remove all saved properties?')) return;
    saveProperties([]);
    setProperties([]);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">CADD</div>
        <div className="sidebar-section">
          <div className="sidebar-heading">Workspace</div>
          <button type="button" className={view === 'search' || view === 'report' ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setView('search')}>
            Search
          </button>
          <button type="button" className={view === 'saved' || view === 'feasibility' ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setView('saved')}>
            Saved properties{properties.length > 0 ? ` (${properties.length})` : ''}
          </button>
        </div>
      </aside>

      <div className="app-main">
        <main>
          {view === 'search' && <SearchHome onFound={handleFound} />}

          {view === 'report' && candidate && (
            <PropertyReport candidate={candidate} onSave={handleSave} onBack={() => setView('search')} />
          )}

          {view === 'saved' && (
            <>
              <PropertyTable properties={properties} onRemove={handleRemove} onFeasibility={handleFeasibility} />
              {properties.length > 0 && (
                <button type="button" className="clear-all" onClick={clearAll}>Clear all properties</button>
              )}
            </>
          )}

          {view === 'feasibility' && feasibilityPropertyId && (() => {
            const property = properties.find((p) => p.id === feasibilityPropertyId);
            return property
              ? <FeasibilityCalculator property={property} onBack={() => setView('saved')} />
              : <p className="hint">Property not found.</p>;
          })()}
        </main>

        <footer>
          <p>
            Scores are a planning-rules heuristic based on statewide LEP zone defaults and the Low and
            Mid-Rise Housing SEPP — they are <strong>not</strong> a substitute for a council planning
            certificate (s10.7), pre-DA advice, or checking the exact LEP minimum lot size map for the
            parcel. Always verify on the{' '}
            <a href="https://www.planningportal.nsw.gov.au/" target="_blank" rel="noreferrer">NSW Planning Portal</a>.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
