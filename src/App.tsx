import { useEffect, useState } from 'react';
import type { NewProperty, Property } from './types';
import { addProperty, loadProperties, removeProperty, saveProperties } from './store/propertyStore';
import { PropertyForm } from './components/PropertyForm';
import { PropertyTable } from './components/PropertyTable';
import './App.css';

function App() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => { setProperties(loadProperties()); }, []);

  function handleAdd(p: NewProperty) {
    setProperties((cur) => addProperty(cur, p));
  }

  function handleRemove(id: string) {
    setProperties((cur) => removeProperty(cur, id));
  }

  function clearAll() {
    if (!confirm('Remove all saved properties?')) return;
    saveProperties([]);
    setProperties([]);
  }

  return (
    <div className="app">
      <header>
        <h1>CADD — NSW Multi-Dwelling Development Finder</h1>
        <p className="tagline">
          Score residential properties in NSW for dual occupancy, multi-dwelling housing and
          subdivision potential against zoning &amp; the Low and Mid-Rise Housing SEPP.
        </p>
      </header>

      <main>
        <PropertyForm onAdd={handleAdd} />
        <PropertyTable properties={properties} onRemove={handleRemove} />
        {properties.length > 0 && (
          <button type="button" className="clear-all" onClick={clearAll}>Clear all properties</button>
        )}
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
  );
}

export default App;
