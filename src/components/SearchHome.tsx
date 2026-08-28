import { useState } from 'react';
import { AddressAutocomplete } from './AddressAutocomplete';
import type { AddressCandidate } from '../services/addressSearch';

export function SearchHome({ onFound }: { onFound: (candidate: AddressCandidate) => void }) {
  const [value, setValue] = useState('');

  return (
    <div className="search-home">
      <h1>Find a property's development potential</h1>
      <p className="tagline">
        Search any NSW address to see its zoning, council and dual occupancy / multi-dwelling /
        subdivision potential — pulled live from free public NSW Government data.
      </p>
      <div className="search-box card">
        <AddressAutocomplete
          value={value}
          onChange={setValue}
          onSelect={(c) => {
            setValue(c.fullAddress);
            onFound(c);
          }}
        />
      </div>
    </div>
  );
}
